import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';

const DB_NAME = 'fqhc.db';

export default function useDatabase() {
    const [db, setDb] = useState<SQLite.SQLiteDatabase | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initDB = async () => {
            try {
                // Load the DB asset
                const asset = Asset.fromModule(require(`../assets/database/${DB_NAME}`));
                await asset.downloadAsync();
                const db = new File(Paths.document, DB_NAME);
                // Copy DB if it doesn't exist
                if (!db.exists) {
                    try {
                        const assetFile = new File(asset.localUri!);
                        assetFile.copy(db);
                    }
                    catch (error) {
                        console.log('Error copying DB file:', error);
                    }
                } else {
                    console.log('DB file already exists at', db.uri);
                }

                // Open database
                const database = await SQLite.openDatabaseAsync(DB_NAME, undefined, Paths.document.uri);
                setDb(database);
                setLoading(false);
            } catch (error) {
                console.log('Error loading DB:', error);
            }
        };
        initDB();
    }, []);

    const query = async (sql: string, params: any[] = []) => {
        if (!db) {
            throw new Error("Database not initialized yet.");
        }

        console.log("Executing SQL:", sql, "Params:", params);
        try {
            const result = await db.getAllAsync(sql, params);
            return result; // returns array of row objects
        } catch (error) {
            console.error("SQL query error:", error);
            throw error;
        }
    };
    
    return { db, loading, query };
}
