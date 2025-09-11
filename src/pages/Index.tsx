import { Link } from "react-router-dom";
import Layout from '@/components/Layout';
import Menu from './Menu';

const Index = () => {
  return (
    <Layout>
      <Menu />
      <div className="fixed bottom-4 right-4">
        <Link to="/auth">
          <button className="text-xs bg-primary/10 text-primary px-3 py-2 rounded-md hover:bg-primary/20 transition-colors">
            Business Login
          </button>
        </Link>
      </div>
    </Layout>
  );
};

export default Index;
