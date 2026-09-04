/* مدخل Vercel Serverless — يحوّل كل الطلبات لتطبيق Express المشترك */
'use strict';
const { createApp } = require('../lib/app');

let handler = null;

module.exports = async (req, res) => {
  try {
    if (!handler) {
      const { app } = await createApp({ root: process.cwd() });
      handler = app;
    }
    return handler(req, res);
  } catch (e) {
    console.error('Function boot error:', e && e.message);
    if (!res.headersSent) res.status(500).json({ error: 'Server boot failed' });
  }
};
