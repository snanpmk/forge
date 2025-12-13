const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  googleId: {
    type: String,
    unique: true
  },
  avatar: {
    type: String
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  total_xp: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String
  }],
  finance_settings: {
      categories: {
          income: { 
              type: [String], 
              default: ["Salary", "Freelance", "Business Profit", "Investments", "Dividends", "Rental Income", "Refunds", "Grants/Awards", "Gifts", "Allowance", "Bonus", "Side Hustle", "Pension", "Other"] 
          },
          expense: { 
              type: [String], 
              default: ["Rent/Mortgage", "Maintenance", "Electricity", "Water", "Internet/WiFi", "Phone Bill", "Gas", "Groceries", "Dining Out", "Coffee/Snacks", "Alcohol", "Fuel", "Public Transport", "Taxi/Uber", "Car Maintenance", "Parking", "Vehicle Insurance", "Health Insurance", "Doctor/Medical", "Pharmacy", "Gym/Fitness", "Personal Care", "Hair/Beauty", "Clothing", "Electronics", "Home Decor", "Subscriptions", "Hobbies", "Entertainment", "Tuition", "Books/Courses", "Stationery", "Software", "Loan Repayment", "Credit Card Bill", "Tax", "Insurance", "Fees/Charges", "Gifts", "Donations", "Family Support", "Pet Care", "Childcare", "Travel", "Emergency", "Other"] 
          }
      }
  }
}, { timestamps: true });

// Ensure only one user exists for this local app
UserSchema.statics.getSingleUser = async function() {
  let user = await this.findOne();
  if (!user) {
    user = await this.create({ username: 'Forge User' });
  }
  return user;
};

module.exports = mongoose.model('User', UserSchema);
