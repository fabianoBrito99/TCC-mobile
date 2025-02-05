import apiError from "@/functions/api-error";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default async function login(state: {}, formData: any) {
  console.log("formData:", formData); // Verifique a estrutura de formData

  const email = formData.username; // Acesse diretamente a propriedade
  const password = formData.password; // Acesse diretamente a propriedade

  try {
    // Verifique se os dados foram preenchidos
    if (!email || !password) throw new Error("Preencha os dados.");

    const response = await fetch("http://192.168.1.4:4000/api/loginMobile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, senha: password }), // Enviando como "senha"
    });

    // Verifique se a resposta não está ok
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.erro || "Email ou senha inválidos.");
    }

    const data = await response.json();

    // Verifique se o token está presente na resposta
    if (!data.usuario) {
      throw new Error("Dados do usuário não foram recebidos.");
    }

    // Armazene o usuário se necessário (ex: nome, id, etc.)
    // await AsyncStorage.setItem("usuario", JSON.stringify(data.usuario));

    // Se houver um token, armazene-o
    // await AsyncStorage.setItem("token", data.token);

    console.log("Login bem-sucedido:", data.usuario); // Log para verificar os dados do usuário

    return { data: data.usuario, ok: true, error: "" }; // Retorne os dados do usuário
  } catch (error: unknown) {
    return apiError(error);
  }
}
