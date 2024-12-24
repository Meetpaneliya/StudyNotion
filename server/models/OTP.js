const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    validate: {
      validator: function (email) {
        // Basic email validation regex
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
      },
      message: "Invalid email format",
    },
  },
  otp: {
    type: String,
    required: [true, "OTP is required"],
    minlength: [6, "OTP must be at least 6 characters long"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5, // Automatically deletes the document after 5 minutes
  },
});

// Define a function to send verification emails
async function sendVerificationEmail(email, otp) {
  try {
    console.log("Preparing to send verification email...");
    console.log("Recipient Email:", email);
    console.log("OTP:", otp);

    // Send email using the mailSender utility
    const mailResponse = await mailSender(
      email,
      "Verification Email",
      emailTemplate(otp)
    );

    console.log("Email sent successfully:", mailResponse?.response);
  } catch (error) {
    console.error("Error occurred while sending email:", error.message);
    throw new Error("Failed to send verification email");
  }
}

// Middleware to send an email after the document is saved
OTPSchema.pre("save", async function (next) {
  try {
    console.log("New OTP document is being saved:", this);

    // Only send email if the document is newly created
    if (this.isNew) {
      await sendVerificationEmail(this.email, this.otp);
    }
    next(); // Proceed to save the document
  } catch (error) {
    console.error("Error in pre-save middleware:", error.message);
    next(error); // Pass the error to the next middleware
  }
});

// Create and export the OTP model
const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;
