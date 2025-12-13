import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Terms and Conditions</h1>
      <div className="prose prose-slate max-w-none text-gray-600">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold mb-3 text-gray-800">1. Agreement to Terms</h2>
        <p className="mb-4">
            These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Forge ("we," "us" or "our"), concerning your access to and use of our application.
        </p>

        <h2 className="text-xl font-semibold mb-3 text-gray-800">2. Intellectual Property Rights</h2>
        <p className="mb-4">
            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us.
        </p>

        <h2 className="text-xl font-semibold mb-3 text-gray-800">3. User Representations</h2>
        <p className="mb-4">
            By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms of Use.
        </p>

        <h2 className="text-xl font-semibold mb-3 text-gray-800">4. Prohibited Activities</h2>
        <p className="mb-4">
            You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
        </p>

        <h2 className="text-xl font-semibold mb-3 text-gray-800">5. Limitation of Liability</h2>
        <p className="mb-4">
            In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the site, even if we have been advised of the possibility of such damages.
        </p>
      </div>
    </div>
  );
}
