import { Router } from 'express';
import { usersData } from '../services/mockData';

const router = Router();

router.get('/', (_req, res) => {
  res.json(usersData);
});

router.post('/', (req, res) => {
  const { name, email, latitude, longitude } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nama dan email harus diisi.' });
  }

  const existingUserIndex = usersData.findIndex((user) => user.email === email);
  const userRecord = {
    id: existingUserIndex >= 0 ? usersData[existingUserIndex].id : usersData.length + 1,
    name,
    email,
    latitude: typeof latitude === 'number' ? latitude : 0,
    longitude: typeof longitude === 'number' ? longitude : 0,
    savedAt: new Date().toISOString()
  };

  if (existingUserIndex >= 0) {
    usersData[existingUserIndex] = { ...usersData[existingUserIndex], ...userRecord };
    return res.status(200).json(usersData[existingUserIndex]);
  }

  usersData.push(userRecord);
  res.status(201).json(userRecord);
});

export default router;
