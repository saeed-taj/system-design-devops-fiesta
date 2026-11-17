import http from 'k6/http';
import { check, sleep } from 'k6';

// The "options" block defines the traffic shape over time
export const options = {
  stages: [
    { duration: '40s', target: 20 },  // Ramp-up: Slowly scale from 0 to 20 virtual users (VUs) over 30 seconds
    { duration: '2m', target: 50 },   // Sustained load: Hold steady at 50 concurrent VUs for 2 minutes (triggers HPA scale-up)
    { duration: '30s', target: 0 },   // Ramp-down: Slowly drop traffic back to 0 users (triggers HPA scale-down)
  ],
};

// This function runs repeatedly for every virtual user simulated by k6
export default function () {
  // Sends a GET request to your API's compute endpoint
  const res = http.get('http://172.18.0.2:30080/compute?iterations=300000');
  
  // Validates that the server successfully replied with an HTTP 200 OK status
  check(res, { 'status is 200': (r) => r.status === 200 });
  
  // A tiny pause (100 milliseconds) between requests per virtual user
  sleep(0.1);
}