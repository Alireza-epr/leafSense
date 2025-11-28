import { ESTACCollections } from "@/types/apiTypes";
import { useMapStore } from "../store/mapStore";
import { getFeatureToken, isTokenExpired } from "../utils/calculationUtils";

export const useTokenCollection = () => {
  const tokenCollection = useMapStore((state) => state.tokenCollection);
  const setTokenCollection = useMapStore((state) => state.setTokenCollection);

  const getTokenCollection = async () => {
    try {
      if (!tokenCollection) {
        const token = await getFeatureToken(ESTACCollections.Sentinel2l2a);
        setTokenCollection(token);
      } else if (isTokenExpired(tokenCollection)) {
        const token = await getFeatureToken(ESTACCollections.Sentinel2l2a);
        setTokenCollection(token);
      } else {
        setTokenCollection((prev) => {
          const validToken = prev!.token;
          return {
            "msft:expiry": prev?.["msft:expiry"] ? prev?.["msft:expiry"] : "",
            token: validToken,
          };
        });
      }
    } catch (error) {
      console.log("useTokenCollection error");
      console.log(error);
      setTokenCollection(null);
    }
  };

  return {
    getTokenCollection,
  };
};
