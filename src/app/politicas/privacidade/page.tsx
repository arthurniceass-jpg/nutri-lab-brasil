import { LegalLayout } from "@/components/store/legal-layout";

export const metadata = { title: "Política de Privacidade | NUTRI LAB BRASIL" };

export default function PrivacidadePage() {
  return (
    <LegalLayout title="Política de privacidade">
      <p>
        Sua privacidade e importante. Esta política explica como tratamos seus
        dados, em conformidade com a LGPD (Lei 13.709/2018).
      </p>
      <h2>Dados que coletamos</h2>
      <p>
        Nome, email, CPF e endereço (para entrega e emissão de nota), alem dos
        dados dos seus pedidos. Não armazenamos dados de cartão: o pagamento e
        processado pelo Mercado Pago.
      </p>
      <h2>Como usamos</h2>
      <p>
        Para processar pedidos, calcular frete, emitir nota fiscal, dar suporte
        e enviar atualizações sobre suas compras.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode acessar, corrigir ou solicitar a exclusão dos seus dados a
        qualquer momento pela área "Minha conta" ou entrando em contato conosco.
      </p>
      <h2>Cookies</h2>
      <p>
        Usamos cookies essenciais para o funcionamento do carrinho e do login.
        Você pode gerenciar os cookies no seu navegador.
      </p>
    </LegalLayout>
  );
}
