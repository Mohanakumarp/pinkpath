// frontend\app\index.js
import { Redirect } from 'expo-router';

// This instantly redirects users to the login screen when they open the app
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}