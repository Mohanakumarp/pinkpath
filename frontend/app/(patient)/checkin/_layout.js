// frontend/app/(patient)/checkin/_layout.js
import { Stack } from 'expo-router';

export default function CheckInLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* You don't need to list every file here. 
        Setting headerShown: false globally for this stack 
        ensures that index, flow-slider, flow-details, and charts 
        all open smoothly without a double header.
      */}
    </Stack>
  );
}