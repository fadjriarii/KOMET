/**
 * formatters.js - Alias / Proxy ke logic.js
 * 
 * Semua logic, kalkulasi, formatting, dan transformasi data
 * dipusatkan di `logic.js`. File ini menyediakan re-export untuk backwards compatibility.
 */

export * from './logic';
export { default } from './logic';
