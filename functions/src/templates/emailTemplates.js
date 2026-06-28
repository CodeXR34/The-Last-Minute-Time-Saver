const APP_URL = process.env.APP_URL || 'https://yourapp.example.com';

const baseStyles = `
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #1e293b;
    background-color: #f8fafc;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background-color: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .header {
    background-color: #4f46e5;
    color: #ffffff;
    padding: 32px 24px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
  }
  .content {
    padding: 32px 24px;
  }
  .task-list {
    margin: 24px 0;
    padding: 0;
    list-style: none;
  }
  .task-item {
    background-color: #f1f5f9;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 12px;
    font-weight: 500;
    color: #334155;
  }
  .task-item.completed {
    background-color: #ecfdf5;
    color: #065f46;
    text-decoration: line-through;
  }
  .cta-button {
    display: inline-block;
    background-color: #4f46e5;
    color: #ffffff !important;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-weight: 600;
    margin-top: 16px;
    text-align: center;
  }
  .footer {
    padding: 24px;
    text-align: center;
    font-size: 14px;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
  }
`;

function layout(title, content, buttonText = 'Open Dashboard', buttonLink = APP_URL) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
          <div style="text-align: center; margin-top: 32px;">
            <a href="${buttonLink}" class="cta-button">${buttonText}</a>
          </div>
        </div>
        <div class="footer">
          You are receiving this because you enabled AI Accountability Emails. <br>
          <a href="${APP_URL}/settings" style="color: #4f46e5;">Manage Preferences</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

const quotes = [
  "Small daily improvements are the key to staggering long-term results.",
  "You don't have to be great to start, but you have to start to be great.",
  "Focus on being productive instead of busy.",
  "Action is the foundational key to all success.",
  "Start where you are. Use what you have. Do what you can.",
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "Quality means doing it right when no one is looking.",
  "Believe you can and you're halfway there.",
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work."
];

const templates = {
  morning: (data) => {
    const topTask = data.pendingTasks[0];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    const content = `
      <p style="font-size: 18px; font-weight: 600;">Good morning, ${data.name}!</p>
      <p>Today is a new opportunity to make progress. You have <strong>${data.pendingTasks.length} tasks</strong> lined up for today.</p>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px; font-style: italic; color: #1e3a8a;">
        "${randomQuote}"
      </div>
      
      <p style="margin-top: 24px; font-weight: 600; color: #475569;">Highest Priority Task:</p>
      <div class="task-item">
        ${topTask ? topTask.title : 'No specific tasks lined up. Time to plan!'}
      </div>
      
      <p style="margin-top: 24px;">Small steps lead to massive results. Let's tackle today's goals together!</p>
    `;
    return layout('🌅 Good Morning!', content, 'Open Dashboard', APP_URL);
  },

  afternoon: (data) => {
    const content = `
      <p style="font-size: 18px; font-weight: 600;">Hi ${data.name},</p>
      <p>Hope your day is going well! Just a gentle productivity check-in.</p>
      <p>You still have <strong>${data.pendingTasks.length} tasks</strong> remaining today. You're making great progress, let's keep the momentum going.</p>
    `;
    return layout('☀️ Afternoon Check-in', content, 'Continue Working', APP_URL);
  },

  evening: (data) => {
    const content = `
      <p style="font-size: 18px; font-weight: 600;">Good evening, ${data.name}.</p>
      <p>The day is wrapping up, but there's still time to finish strong.</p>
      <div style="display: flex; gap: 16px; margin: 24px 0;">
        <div style="flex: 1; background: #ecfdf5; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #059669;">${data.completedCount}</div>
          <div style="font-size: 14px; color: #065f46;">Completed</div>
        </div>
        <div style="flex: 1; background: #eff6ff; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #2563eb;">${data.pendingTasks.length}</div>
          <div style="font-size: 14px; color: #1e40af;">Remaining</div>
        </div>
      </div>
      <p>Let's finish today's goals and end the day with a clear mind.</p>
    `;
    return layout('🌇 Evening Encouragement', content, 'Resume Tasks', APP_URL);
  },

  nightSummary: (data) => {
    const hasTomorrow = data.tomorrowTasks && data.tomorrowTasks.length > 0;
    const content = `
      <p style="font-size: 18px; font-weight: 600;">Daily Summary for ${data.name}</p>
      <p>Here is a quick look at what you accomplished today.</p>
      
      <ul class="task-list">
        <li class="task-item completed">✅ Completed: ${data.completedCount} tasks</li>
        <li class="task-item">⏳ Pending: ${data.pendingTasks.length} tasks</li>
      </ul>
      
      ${hasTomorrow ? `
        <p style="margin-top: 24px; font-weight: 600;">A sneak peek at tomorrow:</p>
        <div class="task-item">${data.tomorrowTasks[0].title} + ${data.tomorrowTasks.length - 1} more</div>
      ` : ''}
      
      <p style="margin-top: 24px;">Rest well and be proud of your efforts today!</p>
    `;
    return layout('🌙 Night Summary', content, 'Open Dashboard', APP_URL);
  },

  weeklyReport: (data) => {
    const content = `
      <p style="font-size: 18px; font-weight: 600;">Your Weekly Progress, ${data.name}</p>
      <p>Consistency is key. Here is how you did this week:</p>
      
      <div style="background: #f1f5f9; padding: 24px; border-radius: 12px; margin: 24px 0;">
        <p style="margin: 0 0 12px 0;"><strong>Tasks Completed:</strong> ${data.totalCompleted}</p>
        <p style="margin: 0 0 12px 0;"><strong>Best Day:</strong> ${data.bestDay || 'N/A'}</p>
        <p style="margin: 0;"><strong>Current Streak:</strong> 🔥 ${data.streak} days</p>
      </div>
      
      <p>Every completed task brings you one step closer to your goals. You're doing amazing!</p>
    `;
    return layout('📊 Weekly Report', content, 'Open Dashboard', APP_URL);
  },

  inactivity: (data) => {
    const content = `
      <p style="font-size: 18px; font-weight: 600;">We've missed you, ${data.name}.</p>
      <p>Looks like you haven't planned anything recently.</p>
      <p>Small daily goals create long-term success. The best time to restart your momentum is right now.</p>
    `;
    return layout('👋 We miss you', content, 'Create Task', APP_URL + '/?action=create-task');
  }
};

module.exports = templates;
