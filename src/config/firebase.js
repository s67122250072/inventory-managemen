
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyCUAQlL54WGlj7zhunv1HjQ8Xo57GSLSqM',
  authDomain: 'inventory-management-9b9b9.firebaseapp.com',
  databaseURL:
    'https://inventory-management-9b9b9-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'inventory-management-9b9b9',
  storageBucket: 'inventory-management-9b9b9.firebasestorage.app',
  messagingSenderId: '57229443408',
  appId: '1:57229443408:web:e637b388ecf6fe910aac55',
  measurementId: 'G-TDB07TK2E0',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const database = getDatabase(app)
