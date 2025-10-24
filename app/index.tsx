import CenterInfoSearch from "@/components/CenterInfoSearch";
import DraggableSearchBar from "@/components/DraggableSearchBar";
import { useThemeColor } from "@/hooks/use-theme-color";
import useDatabase from "@/hooks/useDatabase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GlassView } from "expo-glass-effect";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { FQHCSite } from "./types";

export default function Map() {
    const [locationColor, setLocationColor] = useState<string>("gray");
    const [nearbyCenters, setNearbyCenters] = useState<FQHCSite[]>([]);

    const [searchRadius, setSearchRadius] = useState<number>(10);
    const [unit, setUnit] = useState<string>("Imperial");
    const [searchingCenters, setSearchingCenters] = useState<boolean>(true);

    const { loading, query } = useDatabase();

    const mapRef = useRef<MapView>(null);

    const themeBack = useThemeColor({}, "background");
    const themeText = useThemeColor({}, "text");

    // --- Utility: Haversine distance in km
    function haversineDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) {
        const R = 6371; // Earth radius in km
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    useEffect(() => {
        if (!loading) {
            setSearchingCenters(true);
            getCurrentLocation(async (location) => {
                try {
                    // Step 1: Fetch all centers (no math in SQL)
                    const vals = await query("SELECT * FROM centers;");
                    const lat = location.coords.latitude;
                    const lon = location.coords.longitude;

                    // Step 2: Compute distance in JS and filter
                    const processed = (vals as FQHCSite[])
                        .map((val) => {
                            const centerLat = Number(
                                val[
                                    "Geocoding Artifact Address Primary Y Coordinate"
                                ]
                            );
                            const centerLon = Number(
                                val[
                                    "Geocoding Artifact Address Primary X Coordinate"
                                ]
                            );
                            const distance =
                                (unit === "Imperial" ? 0.621371 : 1) *
                                haversineDistance(
                                    lat,
                                    lon,
                                    centerLat,
                                    centerLon
                                );
                            return { ...val, distance };
                        })
                        .filter((val) => val.distance < searchRadius)
                        .sort((a, b) => a.distance - b.distance);

                    setNearbyCenters(processed);
                } catch (error) {
                    console.error("Error querying database:", error);
                }
            });
            setSearchingCenters(false);
        }
    }, [loading, searchRadius, unit]);

    const moveToLocation = (location: Location.LocationObject) => {
        if (mapRef.current) {
            setLocationColor("#60b1fc");
            mapRef.current.animateToRegion(
                {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                },
                1000
            );
        }
    };

    async function getCurrentLocation(
        callback?: (location: Location.LocationObject) => void
    ) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            console.warn("Location permission not granted");
            return;
        }
        const location = await Location.getCurrentPositionAsync({});
        callback && callback(location);
    }

    useEffect(() => {
        getCurrentLocation();
    }, []);

    useFocusEffect(() => {
        getData();
    });

    const getData = async () => {
        try {
            const asycnUnit = await AsyncStorage.getItem("unitPref");
            if (asycnUnit !== null) {
                unit !== asycnUnit && setUnit(asycnUnit);
            } else {
                await AsyncStorage.setItem("unitPref", "Imperial");
                setUnit("Imperial");
            }
            const asyncSearchRadius = await AsyncStorage.getItem("radiusPref");
            if (asyncSearchRadius !== null) {
                Number(asyncSearchRadius) !== searchRadius &&
                    setSearchRadius(Number(asyncSearchRadius));
            } else {
                await AsyncStorage.setItem("radiusPref", "10");
                setSearchRadius(Number("10"));
            }
        } catch (e) {
            console.log(e);
        }
    };

    useLayoutEffect(() => {
        getData();
    }, []);

    return (
        <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
            <MapView
                onPanDrag={() => {
                    locationColor !== "gray" && setLocationColor("gray");
                }}
                mapPadding={{ top: 50, bottom: 50, left: 20, right: 20 }}
                ref={mapRef}
                style={{ width: "100%", height: "100%" }}
                showsMyLocationButton
                showsUserLocation
            >
                {nearbyCenters.map((center) => (
                    <Marker
                        key={center["BPHC Assigned Number"]}
                        coordinate={{
                            latitude: Number(
                                center[
                                    "Geocoding Artifact Address Primary Y Coordinate"
                                ]
                            ),
                            longitude: Number(
                                center[
                                    "Geocoding Artifact Address Primary X Coordinate"
                                ]
                            ),
                        }}
                        title={center["Site Name"]}
                        description={center["Site Address"]}
                    />
                ))}
            </MapView>

            <DraggableSearchBar
                searchContent={
                    <>
                        {searchingCenters ? (
                            <View style={{width: "100%", height: "100%", marginTop: 10, alignItems: "center", justifyContent: "center"}} >
                                <ActivityIndicator color={themeText} />
                            </View>
                        ) : (
                            nearbyCenters.length > 0 ?
                            nearbyCenters.map((center) => (
                                <CenterInfoSearch
                                    textColor={themeText}
                                    color={themeBack}
                                    key={center["BPHC Assigned Number"]}
                                    site={center}
                                    unit={unit === "Imperial" ? "mi" : "km"}
                                />
                            ))
                            :
                            <View style={{width: "100%", height: "100%", marginTop: 10, alignItems: "center", justifyContent: "center"}} >
                                <Text style={{color: themeText, fontWeight: "bold"}} >No Centers within Search Area</Text>
                            </View>
                        )}
                    </>
                }
            >
                <GlassView
                    isInteractive
                    style={{
                        padding: 10,
                        borderRadius: 40,
                        alignSelf: "flex-end",
                        gap: 20,
                    }}
                >
                    <Pressable
                        onPress={() => getCurrentLocation(moveToLocation)}
                    >
                        <Ionicons
                            name="navigate"
                            size={30}
                            color={locationColor}
                        />
                    </Pressable>
                    <Pressable onPress={() => router.navigate("/settings")}>
                        <Ionicons name="settings" size={30} color={"gray"} />
                    </Pressable>
                </GlassView>
            </DraggableSearchBar>
        </View>
    );
}
