const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { sendEmail } = require("./src/services/emailService");
const templates = require("./src/templates/emailTemplates");

admin.initializeApp();
const db = admin.firestore();

exports.sendTestEmail = onCall({ secrets: ["RESEND_API_KEY"] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Unauthenticated");
  }

  const userDoc = await db.collection("users").doc(uid).get();
  const user = userDoc.data();
  if (!user || !user.email) {
    throw new HttpsError("not-found", "User email not found");
  }

  try {
    const templateData = {
      name: user.displayName || user.name || 'User',
      pendingTasks: [{ title: 'Example Task 1' }, { title: 'Example Task 2' }],
      completedCount: 1,
      totalCompleted: 10,
      streak: user.streak || 1,
    };

    await sendEmail({
      to: user.email,
      subject: '👋 Test Email: AI Accountability is Active!',
      html: templates.morning(templateData)
    });

    return { success: true, message: 'Test email sent successfully' };
  } catch (error) {
    console.error("Test email error:", error);
    throw new HttpsError("internal", error.message || "Failed to send test email");
  }
});

exports.processEmailReminders = onSchedule({ schedule: "0 * * * *", secrets: ["RESEND_API_KEY"] }, async (event) => {
  // Optimization: Only query users who have email settings enabled
  const settingsSnapshot = await db.collection("userSettings")
    .where("emailSettings.enabled", "==", true)
    .get();

  if (settingsSnapshot.empty) return;

  const userIds = settingsSnapshot.docs.map(doc => doc.id);
  
  // Fetch users in batches to avoid huge queries, but for simplicity assuming < 10 in IN clause or just fetching all active users
  const usersMap = {};
  for (let i = 0; i < userIds.length; i += 30) {
    const batchIds = userIds.slice(i, i + 30);
    const usersSnap = await db.collection("users").where(admin.firestore.FieldPath.documentId(), "in", batchIds).get();
    usersSnap.forEach(doc => {
      usersMap[doc.id] = doc.data();
    });
  }

  const now = new Date();

  for (const doc of settingsSnapshot.docs) {
    const userId = doc.id;
    const data = doc.data();
    const settings = data.emailSettings;
    const logs = data.emailLogs || {};
    const analytics = data.emailAnalytics || {
      totalSent: 0,
      lastSentAt: null,
      tasksCompletedAfterReminder: 0,
      remindersSent: 0
    };
    
    const user = usersMap[userId];
    if (!user || !user.email) continue;

    try {
      const userTimezone = settings.timezone || 'UTC';
      const userTimeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const parts = userTimeFormatter.formatToParts(now);
      const userDateStr = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
      const userHourStr = `${parts.find(p => p.type === 'hour').value}:00`; 

      const isTimeMatch = (configTime) => {
        if (!configTime) return false;
        return configTime.startsWith(userHourStr.split(':')[0]); 
      };

      const tasksSnapshot = await db.collection("tasks")
        .where("userId", "==", userId)
        .get();
        
      const allTasks = [];
      tasksSnapshot.forEach(t => allTasks.push({ id: t.id, ...t.data() }));
      
      const pendingTasks = allTasks.filter(t => t.status !== 'Completed' && (!t.dueDate || (t.dueDate && typeof t.dueDate === 'string' ? t.dueDate.startsWith(userDateStr) : true)));
      const completedTasks = allTasks.filter(t => t.status === 'Completed');
      const completedToday = completedTasks.filter(t => {
        if (!t.completedAt) return false;
        const cDate = t.completedAt.toDate ? t.completedAt.toDate() : new Date(t.completedAt);
        return cDate.toISOString().startsWith(userDateStr);
      });

      // Track analytics: count tasks completed since the last sent reminder
      if (analytics.lastSentAt) {
        const lastSentDate = new Date(analytics.lastSentAt);
        const completedSinceLast = completedToday.filter(t => {
          const cDate = t.completedAt.toDate ? t.completedAt.toDate() : new Date(t.completedAt);
          return cDate.getTime() > lastSentDate.getTime();
        }).length;
        
        // Add to analytics (prevent double counting by updating a lastCheckedAt timestamp, but for simplicity we assume this runs hourly and we can just approximate or rely on the frontend to calculate true success rate).
        // A better approach is to store a flag on the task itself, but for now we'll estimate it.
        // Actually, to prevent double counting, let's keep it simple: just track total completed tasks today if an email was sent today.
      }

      const templateData = {
        name: user.displayName || user.name || 'User',
        pendingTasks,
        completedCount: completedToday.length,
        totalCompleted: completedTasks.length,
        streak: user.streak || 0,
      };

      let updateLogs = false;
      let emailsSentThisRun = 0;
      const newLogs = { ...logs };

      const handleSend = async (key, subject, html) => {
        await sendEmail({ to: user.email, subject, html });
        newLogs[key] = userDateStr;
        newLogs[`${key}Timestamp`] = now.getTime(); // Keep history for Notification History UI
        updateLogs = true;
        emailsSentThisRun++;
      };

      // 1. Morning Reminder
      if (settings.morning?.enabled && isTimeMatch(settings.morning.time)) {
        if (logs.morning !== userDateStr && pendingTasks.length > 0) {
          await handleSend('morning', '🌅 Good Morning! Let\'s crush today\'s tasks', templates.morning(templateData));
        }
      }

      // 2. Afternoon Reminder
      if (settings.afternoon?.enabled && isTimeMatch(settings.afternoon.time)) {
        if (logs.afternoon !== userDateStr && pendingTasks.length > 0) {
          await handleSend('afternoon', '☀️ Afternoon Check-in: You\'re doing great', templates.afternoon(templateData));
        }
      }

      // 3. Evening Reminder
      if (settings.evening?.enabled && isTimeMatch(settings.evening.time)) {
        if (logs.evening !== userDateStr && pendingTasks.length > 0) {
          await handleSend('evening', '🌇 Evening Encouragement: Let\'s finish strong', templates.evening(templateData));
        }
      }

      // 4. Night Summary
      if (settings.nightSummary?.enabled && isTimeMatch(settings.nightSummary.time)) {
        if (logs.nightSummary !== userDateStr && (completedToday.length > 0 || pendingTasks.length > 0)) {
          await handleSend('nightSummary', '🌙 Your Daily Night Summary', templates.nightSummary(templateData));
        }
      }

      // 5. Inactivity Reminder
      if (settings.inactivityReminder?.enabled) {
        let latestTaskTime = doc.createTime ? doc.createTime.toDate().getTime() : now.getTime();
        let hasTasks = false;
        
        allTasks.forEach(t => {
          const tTime = t.createdAt?.toDate ? t.createdAt.toDate().getTime() : (t.createdAt ? new Date(t.createdAt).getTime() : null);
          if (tTime && !isNaN(tTime)) {
            if (!hasTasks || tTime > latestTaskTime) {
              latestTaskTime = tTime;
            }
            hasTasks = true;
          }
        });
        
        const daysSinceActivity = (now.getTime() - latestTaskTime) / (1000 * 3600 * 24);
        
        if (daysSinceActivity > 3) {
          const lastInactivitySent = logs.inactivityReminderTimestamp || 0;
          const daysSinceLastInactivity = (now.getTime() - lastInactivitySent) / (1000 * 3600 * 24);
          
          if (daysSinceLastInactivity > 7) {
            await handleSend('inactivityReminder', '👋 We miss you - Let\'s get back on track', templates.inactivity(templateData));
          }
        }
      }

      if (updateLogs) {
        // Update analytics
        analytics.totalSent = (analytics.totalSent || 0) + emailsSentThisRun;
        analytics.lastSentAt = now.getTime();
        analytics.remindersSent = (analytics.remindersSent || 0) + emailsSentThisRun;
        
        // Calculate success (tasks completed after any reminder today)
        // If they completed tasks today, and they received a reminder today prior to completing it...
        let completedAfterReminder = 0;
        if (logs.morning === userDateStr || logs.afternoon === userDateStr || logs.evening === userDateStr) {
           const firstReminderTime = Math.min(
             logs.morning === userDateStr ? logs.morningTimestamp || Infinity : Infinity,
             logs.afternoon === userDateStr ? logs.afternoonTimestamp || Infinity : Infinity,
             logs.evening === userDateStr ? logs.eveningTimestamp || Infinity : Infinity
           );
           
           completedToday.forEach(t => {
             const cTime = t.completedAt.toDate ? t.completedAt.toDate().getTime() : new Date(t.completedAt).getTime();
             if (cTime > firstReminderTime) completedAfterReminder++;
           });
        }
        // Only update this stat on the night summary run to avoid recalculating repeatedly all day
        if (logs.nightSummary === userDateStr && emailsSentThisRun > 0) {
           analytics.tasksCompletedAfterReminder = (analytics.tasksCompletedAfterReminder || 0) + completedAfterReminder;
        }

        await doc.ref.update({ 
          emailLogs: newLogs,
          emailAnalytics: analytics 
        });
      }

    } catch (e) {
      console.error(`Error processing emails for user ${userId}:`, e);
    }
  }
});
