import { LegalLayout } from "@/components/store/legal-layout";

export const metadata = { title: "Trocas e Devoluções | NUTRI LAB BRASIL" };

export default function TrocasPage() {
  return (
    <LegalLayout title="Trocas e devoluções">
      <p>
        Queremos que você fique satisfeito com a sua compra. Esta política segue
        o Código de Defesa do Consumidor.
      </p>
      <h2>Arrependimento (7 dias)</h2>
      <p>
        Você pode desistir da compra em até 7 dias corridos após o recebimento,
        desde que o produto esteja lacrado e sem sinais de uso. O valor pago e
        devolvido integralmente, incluindo o frete.
      </p>
      <h2>Produto com defeito</h2>
      <p>
        Em caso de defeito de fabricação, entre em contato em até 30 dias após o
        recebimento. Faremos a troca por um item igual ou a devolução do valor.
      </p>
      <h2>Como solicitar</h2>
      <p>
        Envie um email para o nosso contato com o número do pedido e uma breve
        descrição. Nossa equipe responde em até 2 dias úteis com as instruções
        de postagem.
      </p>
      <p>
        Suplementos abertos, por segurança alimentar, só podem ser devolvidos em
        caso de defeito.
      </p>
    </LegalLayout>
  );
}
