import React from "react";
import { Text, StyleSheet } from "react-native";

export default function ErrorMessage({ error }: { error: string }) {
  if (error === "") return null;
  return <Text style={styles.errorText}>{error}</Text>;
}

const styles = StyleSheet.create({
  errorText: {
    color: "#f31",
    marginVertical: 10,
  },
});
