// app/_layout.tsx
import { Stack } from "expo-router";


export default function Layout() {
  return (
    <Stack>

      <Stack.Screen name="login" />
      <Stack.Screen name="conta" />
      <Stack.Screen name="cadastro" />
    </Stack>
  );
}
