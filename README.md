# Forge - Ultimate Self-Development Hub

A comprehensive dashboard for tracking your life, built with the MERN stack (MongoDB, Express, React, Node.js). This application integrates Habit Tracking, Prayer Schedules, Goal Planning, Brain Dumps, and Finance Management into a single, cohesive interface.

## 🚀 Features

## 🚀 Features

### 📊 Dashboard
- **Performance Analytics**: Visual graphs (30-day trends) showing your consistency with habits and prayers.
- **Weekly/Monthly Filters**: Toggle between views to analyze short-term vs long-term performance.
- **Snapshots**: Quick views of upcoming goals, financial status, and pending brain dump items.

### 🎮 Gamification
- **XP System**: Earn Experience Points for every habit completed, task finished, and prayer logged.
- **Leveling**: visual progress bar and level display that grows as you stay productive.
- **Rewards**: Real-time feedback and toast notifications celebrating your wins.

### 🎨 Theme Customization
- **Multiple Themes**: Choose from Light, Dark, Midnight, and Nature themes.
- **Persistent Settings**: Your theme preference is saved and applied automatically.

### 📱 PWA / Mobile Support
- **Installable**: Add to Home Screen on iOS and Android for a native app-like experience.
- **Offline Capable**: Core UI loads instantly, even with spotty internet.

### ✅ Habit Tracker
- **Daily Tracking**: Mark habits as complete/incomplete.
- **Streaks**: Visual indicators of your current streak.

### 🤲 Prayer Tracker
- **5 Daily Prayers**: Track Fajr, Dhuhr, Asr, Maghrib, and Isha.
- **Status Types**: On-Time, Late, Missed, Pending.
- **Scores**: Calculates daily prayer performance.

### 🎯 Goal Planner
- **Target Dates**: Set due dates for your goals.
- **Milestones**: Break down big goals into actionable steps.
- **Countdown**: Visual cues for deadlines (e.g., "5 days left", "Overdue").

### 💸 Finance Tracker
- **Budget Planning**: Set monthly limits for categories like Food, Rent, etc.
- **Transaction History**: Track Income, Expense, Loans, and Investments.
- **Analytics**: Pie charts for expense breakdown and Bar charts for weekly spending trends.

### 🧠 Brain Dump
- **Capture**: Quick input for items cluttering your mind.
- **Process**: Convert brain dumps into actionable Tasks or Ideas.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide Icons, React Query.
- **PWA**: vite-plugin-pwa for offline capabilities and installation.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose ORM).
- **Tooling**: Concurrently (to run client/server together).

## 📦 Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/my-journal.git
    cd my-journal
    ```

2.  **Install Dependencies**:
    *   **Server**:
        ```bash
        cd server
        npm install
        ```
    *   **Client**:
        ```bash
        cd client
        npm install
        ```

3.  **Environment Variables**:
    *   Create a `.env` file in the `server` directory:
        ```env
        PORT=5000
        MONGO_URI=your_mongodb_connection_string
        ```

4.  **Run the Application**:
    *   From the root or server directory (if configured with concurrently):
        ```bash
        npm run dev
        ```
    *   *Alternatively*, run them separately in two terminals:
        ```bash
        # Terminal 1 (Server)
        cd server
        npm run dev

        # Terminal 2 (Client)
        cd client
        npm run dev
        ```

## 🤝 Contributing

Feel free to fork this repository and submit pull requests for any features or fixes!
