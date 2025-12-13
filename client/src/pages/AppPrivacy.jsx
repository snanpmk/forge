import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none text-gray-600">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold mb-3 text-gray-800">1. Introduction</h2>
        <p className="mb-4">
          Welcome to Forge. We respect your privacy and are committed to protecting your personal data. 
          This privacy policy will inform you as to how we look after your personal data when you visit our website 
          and tell you about your privacy rights and how the law protects you.
        </p>

        <h2 className="text-xl font-semibold mb-3 text-gray-800">2. Data We Collect</h2>
        <p className="mb-4">
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
          <li><strong>Contact Data:</strong> includes email address.</li>
          <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
        </ul>

        <h2 className="text-xl font-semibold mb-3 text-gray-800">3. How We Use Your Data</h2>
        <p className="mb-4">
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
          <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
          <li>Where we need to comply with a legal or regulatory obligation.</li>
        </ul>

        <h2 className="text-xl font-semibold mb-3 text-gray-800">4. Data Security</h2>
        <p className="mb-4">
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
        </p>

        <h2 className="text-xl font-semibold mb-3 text-gray-800">5. Contact Us</h2>
        <p>
          If you have any questions about this privacy policy or our privacy practices, please contact us.
        </p>
      </div>
      <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex justify-center opacity-0 hover:opacity-100 transition-opacity duration-500">
              <button 
                  onClick={async () => {
                      if (window.confirm("⚠️ DANGER ZONE ⚠️\n\nAre you sure you want to PERMANENTLY DELETE all your data?\n(Goals, Habits, Prayers, Finance, Tasks)\n\nThis action cannot be undone.")) {
                          if (window.confirm("Please confirm again.\n\nType 'RESET' in your mind and click OK to wipe everything.")) {
                              try {
                                  // We need to import api here, but PrivacyPolicy is a component.
                                  // Let's assume we can import it at the top level or use fetch. 
                                  // Since we don't have 'api' imported in this file yet, I'll update imports too.
                                  const token = localStorage.getItem('token');
                                  if(!token) return;
                                  
                                  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/user/reset`, {
                                      method: 'DELETE',
                                      headers: {
                                          'Authorization': `Bearer ${token}`
                                      }
                                  });
                                  
                                  if (res.ok) {
                                      alert("Data wiped. Refreshing...");
                                      window.location.reload();
                                  } else {
                                      alert("Failed to reset data.");
                                  }
                              } catch (e) {
                                  console.error(e);
                                  alert("Error resetting data.");
                              }
                          }
                      }
                  }}
                  className="text-xs text-red-200 hover:text-red-500 font-mono transition-colors"
              >
                  Reset Data
              </button>
          </div>
      </div>
    </div>
  );
}
