import { io } from 'socket.io-client';
// Đổi URL này sang link server render/vercel khi đưa lên host thật
export const socket = io('https://banpicktest.onrender.com/');
