'use client';
import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { loadFromCookie } from '@/store/slices/authSlice';

export default function AppInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadFromCookie());
  }, [dispatch]);

  return null;
}
