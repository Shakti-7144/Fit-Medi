Fit-Medi 🏥💪

An AI-powered integrated healthcare and fitness platform that combines fitness tracking, health record management, AI medical assistance, doctor appointments, and smart analytics into one unified ecosystem.

Built to bridge the gap between personal fitness and digital healthcare, Fit-Medi provides users with intelligent health insights, secure medical storage, and seamless doctor interaction.

🚀 Features

🔐 Authentication & User Roles

Secure Login & Signup
Firebase Authentication
Role-based access:
User
Doctor

💪 Fitness Dashboard

Track daily fitness activities
Workout logging
Health metrics monitoring
Progress visualization
Smart analytics dashboard

🍎 AI Meal Analysis

AI-powered meal evaluation
Nutrition insights using Gemini AI
Food recommendations
Calorie & health analysis

🩺 Health Records Management

Upload and manage:
Prescriptions
Reports
Medical documents
Cloud storage using Firebase Storage
Organized digital medical history

🤖 AI Medical Assistant

Medical summary generation
Symptom relation analysis
AI-assisted health insights
Smart health recommendations

👨‍⚕️ Doctor Module

Doctor Dashboard
Appointment scheduling
Patient management
Doctor availability management

📅 Appointment Booking

Book doctor appointments
Schedule management
Real-time appointment tracking

☁️ Cloud Infrastructure

Firebase Firestore Database
Firebase Storage
Secure Firestore Rules
Cloud-based architecture

🛠️ Tech Stack

Technology	Usage
React.js	Frontend
Firebase Auth	Authentication
Firestore	Database
Firebase Storage	File Storage
Gemini AI	AI Features
Tailwind CSS	Styling
Node.js / API Routes	Backend Services

📂 Project Structure
Fit-Medi/
│
├── public/                 # Static assets and public files
├── src/                    # Main application source code
│   ├── components/         # Reusable UI components
│   ├── pages/              # Application pages and routes
│   ├── services/           # API and backend integrations
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility/helper functions
│   └── styles/             # Global styling files
│
├── supabase/               # Supabase configuration and functions
│
├── .env                    # Environment variables
├── .gitignore              # Git ignored files configuration
├── README.md               # Project documentation
├── components.json         # UI component configuration
├── eslint.config.js        # ESLint configuration
├── index.html              # Main HTML entry point
├── package.json            # Project dependencies and scripts
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── vitest.config.ts        # Vitest testing configuration

⚙️ Installation

1️⃣ Clone the Repository
git clone https://github.com/Shakti-7144/Fit-Medi.git
2️⃣ Navigate to Project Folder
cd Fit-Medi
3️⃣ Install Dependencies
npm install
4️⃣ Setup Firebase Environment Variables

Create a .env file:

VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

▶️ Run the Project
npm run dev

🧠 AI Functionalities

Fit-Medi integrates AI to improve healthcare accessibility and user experience.

AI Modules
Meal Analysis
Medical Summary Generation
Symptom Correlation Analysis
Smart Recommendations

Powered using:

Gemini AI APIs

🔒 Security

Firebase Authentication
Firestore Security Rules
Protected User Data
Secure Cloud Storage


🌍 Future Enhancements

Smartwatch integration
Real-time health monitoring
AI chatbot for medical assistance
Emergency alert system
Fitness wearable sync
Telemedicine support
Personalized AI fitness coach

🤝 Contributing

Contributions are welcome!

Fork the repository
Create your feature branch
git checkout -b feature/AmazingFeature
Commit your changes
git commit -m 'Add some AmazingFeature'
Push to the branch
git push origin feature/AmazingFeature
Open a Pull Request
📄 License

This project is licensed under the MIT License.
