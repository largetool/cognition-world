import type { AppProps } from 'next/app';
import type { AppContext } from 'next/app';
import App from 'next/app';
import { StaticRouter } from 'react-router-dom/server';
import { BrowserRouter } from 'react-router-dom';
import { SSRDataContext } from '../src/utils/SSRContext';
import '../src/styles/index.css';

const isClient = typeof window !== 'undefined';

interface MyAppProps extends AppProps {
  location?: string;
}

function MyApp({ Component, pageProps, location }: MyAppProps) {
  const content = (
    <SSRDataContext.Provider value={pageProps}>
      <Component {...pageProps} />
    </SSRDataContext.Provider>
  );

  if (isClient) {
    return <BrowserRouter>{content}</BrowserRouter>;
  }

  return (
    <StaticRouter location={location || '/'}>
      {content}
    </StaticRouter>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  const location = appContext.ctx.req?.url || '/';
  return { ...appProps, location };
};

export default MyApp;
