import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: 'https://7ratu4x5.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM0NzF9.ALQ2k9V6hrERL978f-1cstz8DR1sXZ1qaQ42_EfEc98'
});

export default client;

