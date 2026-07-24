import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getCurrentSite } from "../../lib/current-site";

export default async function NotFound() {
  const site = await getCurrentSite();

  return (
    <>
      <Header menu={site?.mainMenu as any} />
      <main style={{ padding: "6rem 2rem", textAlign: "center" }}>
        <h1>404</h1>
        <p>This page could not be found.</p>
      </main>
      <Footer />
    </>
  );
}
