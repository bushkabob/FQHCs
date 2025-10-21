import CenterInfoSearch from '@/components/CenterInfoSearch';
import DraggableSearchBar from '@/components/DraggableSearchBar';
import useDatabase from '@/hooks/useDatabase';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from "react-native";
import MapView, { Marker } from 'react-native-maps';
import { FQHCSite } from './types';

export default function Map() {
    const [locationColor, setLocationColor] = useState<string>('gray');
    const [nearbyCenters, setNearbyCenters] = useState<FQHCSite[]>([]);

    const { loading, query } = useDatabase();

    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        if (!loading) {
            getCurrentLocation((location) => {
                query("SELECT *, ((\"Geocoding Artifact Address Primary X Coordinate\" - ?) * (\"Geocoding Artifact Address Primary X Coordinate\" - ?) + (\"Geocoding Artifact Address Primary Y Coordinate\" - ?) * (\"Geocoding Artifact Address Primary Y Coordinate\" - ?)) AS distance FROM centers WHERE distance < 0.1 ORDER BY distance ASC;", [location.coords.longitude, location.coords.longitude, location.coords.latitude, location.coords.latitude])
                .then((vals) => {
                    setNearbyCenters(vals as FQHCSite[]);
                    console.log("Nearby Centers:", vals);
                })
                .catch((error) => {
                    console.error("Error querying database:", error);
                })
                
            })

        }
    }, [loading])

    const moveToLocation = (location: Location.LocationObject) => {
        if (mapRef.current) {
            setLocationColor("#60b1fc");
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    }

    async function getCurrentLocation(callback?: (location: Location.LocationObject) => void) {
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        callback && callback(location);
    }

    useEffect(() => {
        getCurrentLocation();
    }, []);


    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <MapView onPanDrag={()=>{locationColor!=="gray"&&setLocationColor("gray")}} mapPadding={{ top: 50, bottom:50, left: 20, right:20 }} ref={mapRef} style={{ width: '100%', height: '100%', }} showsMyLocationButton showsUserLocation>
                {nearbyCenters.map((center) => (
                    <Marker
                        key={center['BPHC Assigned Number']}
                        coordinate={{
                            latitude: Number(center["Geocoding Artifact Address Primary Y Coordinate"]),
                            longitude: Number(center["Geocoding Artifact Address Primary X Coordinate"]),
                        }}
                        title={center['Site Name']}
                        description={center['Site Address']}
                    />
                ))}
            </MapView>
            <DraggableSearchBar 
                searchContent={
                    nearbyCenters.map((center) => <CenterInfoSearch key={center['BPHC Assigned Number']} site={center} />)
                }
            >
                <GlassView isInteractive style={{ padding: 10, borderRadius: 40, alignSelf: "flex-end"}} >
                    <Pressable onPress={() => { getCurrentLocation(moveToLocation) }} >
                        <Ionicons name="navigate" size={30} color={locationColor} />
                    </Pressable>
                </GlassView>
            </DraggableSearchBar>
        </View>
    );
}

