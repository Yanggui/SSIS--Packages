"use strict";

module.exports = {
    isDevelopment: process.env.NODE_ENV && process.env.NODE_ENV.trim() === "development" ? true : false
};