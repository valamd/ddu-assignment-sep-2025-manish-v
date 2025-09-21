
const Joi = require('joi');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const registerSchema = Joi.object({
  username: Joi.string().min(2).max(50).required(),
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().pattern(passwordRegex).required()
});

const loginSchema = Joi.object({
  email: Joi.string().pattern(emailRegex).required(),
  password: Joi.string().required()
});

const expenseSchema = Joi.object({
  amount: Joi.number().positive().max(100000).precision(2).required(),
  description: Joi.string().max(200).required(),
  category_id: Joi.number().integer().required(),
  payment_method: Joi.string().valid('cash','card','upi','netbanking','wallet').required(),
  expense_date: Joi.date().iso().required(),
  tags: Joi.string().allow('').optional(),
  receipt_path: Joi.string().allow('').optional()
});

module.exports = { registerSchema, loginSchema, expenseSchema };
