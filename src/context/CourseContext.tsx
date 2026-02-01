'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth';

// Define the Shop type based on what we use in search/page.tsx
// We can refine this shared type later if needed
export interface Shop {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  photos?: { name: string }[];
  location?: { latitude: number; longitude: number };
  aiAnalysis?: {
    score: number;
    short_summary: string;
    founding_year: string;
    tabelog_rating?: number;
    reasoning?: string;
    tabelog_name?: string;
  };
  googleMapsUri?: string;
}

interface CourseContextType {
  courseItems: Shop[];
  addToCourse: (shop: Shop) => void;
  removeFromCourse: (shopId: string) => void;
  isInCourse: (shopId: string) => boolean;
  clearCourse: () => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [courseItems, setCourseItems] = useState<Shop[]>([]);
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage or Firestore on mount/auth change
  useEffect(() => {
    const loadCourse = async () => {
       if (user) {
          // Logged in: Load from Firestore
          try {
             const docRef = doc(db, 'users', user.uid, 'course', 'default');
             const docSnap = await getDoc(docRef);
             
             if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.items) {
                   setCourseItems(data.items);
                }
             } else {
                // If no cloud data, maybe we should sync local to cloud?
                // For now, let's keep it simple: if empty cloud, start empty (or keep current state if we want to migrate)
                // Migration strategy: If local has items and cloud is empty, save local to cloud.
                const local = localStorage.getItem('shinise_course_items');
                if (local) {
                   const localItems = JSON.parse(local);
                   if (localItems.length > 0) {
                      setCourseItems(localItems);
                      // Sync to cloud immediately
                      await setDoc(docRef, { items: localItems });
                   }
                }
             }
          } catch (e) {
             console.error("Failed to load course from Firestore", e);
          }
       } else {
          // Anonymous: Load from localStorage
          const saved = localStorage.getItem('shinise_course_items');
          if (saved) {
            try {
              setCourseItems(JSON.parse(saved));
            } catch (e) {
              console.error("Failed to parse saved course items", e);
            }
          }
       }
       setIsLoaded(true);
    };

    loadCourse();
  }, [user]);

  // Save to localStorage and Firestore on change
  useEffect(() => {
    if (!isLoaded) return;

    // Always save to localStorage as backup/cache
    localStorage.setItem('shinise_course_items', JSON.stringify(courseItems));

    // If logged in, save to Firestore
    if (user) {
       const saveToCloud = async () => {
          try {
            const docRef = doc(db, 'users', user.uid, 'course', 'default');
            await setDoc(docRef, { items: courseItems }, { merge: true });
          } catch (e) {
             console.error("Failed to save course to Firestore", e);
          }
       };
       saveToCloud();
    }
  }, [courseItems, user, isLoaded]);

  const addToCourse = (shop: Shop) => {
    setCourseItems((prev) => {
      if (prev.some((item) => item.id === shop.id)) return prev;
      return [...prev, shop];
    });
  };

  const removeFromCourse = (shopId: string) => {
    setCourseItems((prev) => prev.filter((item) => item.id !== shopId));
  };

  const isInCourse = (shopId: string) => {
    return courseItems.some((item) => item.id === shopId);
  };

  const clearCourse = () => {
    setCourseItems([]);
  };

  return (
    <CourseContext.Provider value={{ courseItems, addToCourse, removeFromCourse, isInCourse, clearCourse }}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}
