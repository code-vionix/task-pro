import { createContext, useContext, useEffect, useState } from 'react';

const ExtensionContext = createContext();

export const useExtension = () => {
  const context = useContext(ExtensionContext);
  if (!context) {
    throw new Error('useExtension must be used within ExtensionProvider');
  }
  return context;
};

export const ExtensionProvider = ({ children }) => {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkExtension();
    const interval = setInterval(checkExtension, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkExtension = () => {
    window.postMessage({ type: 'CHECK_EXTENSION' }, '*');
    
    const handleMessage = (event) => {
      if (event.data.type === 'EXTENSION_INSTALLED') {
        setExtensionInstalled(true);
        setChecking(false);
      }
    };

    window.addEventListener('message', handleMessage);
    
    setTimeout(() => {
      setChecking(false);
    }, 1000);

    return () => window.removeEventListener('message', handleMessage);
  };

  return (
    <ExtensionContext.Provider value={{ extensionInstalled, checking }}>
      {children}
    </ExtensionContext.Provider>
  );
};
