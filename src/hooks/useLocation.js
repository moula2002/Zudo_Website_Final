import { useState, useEffect, useCallback } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState({
    address: '',
    city: '',
    pincode: '',
    lat: null,
    lng: null,
    loading: false,
    error: null
  });

  const fetchLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation not supported');
        setLocation(prev => ({ ...prev, error, loading: false }));
        reject(error);
        return;
      }

      setLocation(prev => ({ ...prev, loading: true }));

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
            const data = await response.json();
            
            // Construct a cleaner address
            const addr = data.address;
            const addressParts = [];
            if (addr.house_number) addressParts.push(addr.house_number);
            if (addr.road) addressParts.push(addr.road);
            if (addr.neighbourhood || addr.suburb) addressParts.push(addr.neighbourhood || addr.suburb);
            
            const cleanAddress = addressParts.join(', ') || data.display_name.split(',').slice(0, 3).join(',');
            const city = addr.city || addr.town || addr.village || '';
            const pincode = addr.postcode || '';
            
            const newLoc = {
              address: cleanAddress,
              city,
              pincode,
              lat: latitude,
              lng: longitude,
              loading: false,
              error: null
            };
            
            setLocation(newLoc);
            localStorage.setItem('userLocation', JSON.stringify({ address: cleanAddress, city, pincode, lat: latitude, lng: longitude }));
            resolve(newLoc);
          } catch (err) {
            setLocation(prev => ({ ...prev, loading: false, error: err }));
            reject(err);
          }
        },
        (err) => {
          setLocation(prev => ({ ...prev, loading: false, error: err }));
          reject(err);
        }
      );
    });
  }, []);

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setLocation({ ...JSON.parse(savedLocation), loading: false, error: null });
    } else {
      fetchLocation().catch(() => {});
    }
  }, [fetchLocation]);

  return { ...location, refresh: fetchLocation };
};
