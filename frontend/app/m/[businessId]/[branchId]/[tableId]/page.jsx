import CustomerMenu from "./customer-menu";

export default async function CustomerMenuPage({ params }) {
  return <CustomerMenu {...await params} />;
}
