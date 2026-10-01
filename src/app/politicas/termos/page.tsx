import { LegalLayout } from "@/components/store/legal-layout";

export const metadata = { title: "Termos de Uso | NUTRI LAB BRASIL" };

export default function TermosPage() {
  return (
    <LegalLayout title="Termos de uso">
      <p>
        Ao usar este site e comprar nossos produtos, você concorda com os termos
        abaixo.
      </p>
      <h2>Produtos</h2>
      <p>
        Comercializamos suplementos alimentares. As imagens são ilustrativas e
        os preços podem mudar sem aviso prévio. Suplementos não substituem uma
        alimentação equilibrada.
      </p>
      <h2>Pedidos e pagamento</h2>
      <p>
        O pedido e confirmado após a aprovação do pagamento. Reservamo-nos o
        direito de cancelar pedidos com suspeita de fraude ou erro de preço.
      </p>
      <h2>Entrega</h2>
      <p>
        Os prazos são estimativas contadas a partir da confirmação do pagamento
        e podem variar conforme a região e a transportadora.
      </p>
      <h2>Contato</h2>
      <p>
        Dúvidas sobre estes termos? Fale com a gente pelos canais informados no
        rodapé do site.
      </p>
    </LegalLayout>
  );
}
