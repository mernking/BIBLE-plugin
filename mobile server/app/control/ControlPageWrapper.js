'use client';

import { Suspense } from 'react';
import ControlPage from './page';

export default function ControlPageWrapper() {
  return (
    <Suspense fallback={<div>Loading control panel...</div>}>
      <ControlPage />
    </Suspense>
  );
}
