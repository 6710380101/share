import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ResourceItem, FavoriteItem, ReportItem, ReportReason, ModerationLogItem, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export interface ResourceFilterParams {
  category?: string;
  educationLevel?: string;
  mediaType?: string;
  searchTerm?: string;
}

// Fetch all published resources
export async function fetchPublishedResources(filters?: ResourceFilterParams): Promise<ResourceItem[]> {
  try {
    const colRef = collection(db, 'resources');
    // Using simple query to ensure composite indexes aren't required upfront
    const q = query(colRef, where('status', '==', 'published'));
    const snapshot = await getDocs(q);

    let items: ResourceItem[] = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as ResourceItem));

    // In-memory sorting & filtering for smooth UX
    if (filters?.category && filters.category !== 'ทั้งหมด') {
      items = items.filter(r => r.category === filters.category);
    }
    if (filters?.educationLevel && filters.educationLevel !== 'ทั้งหมด') {
      items = items.filter(r => r.educationLevel === filters.educationLevel);
    }
    if (filters?.mediaType && filters.mediaType !== 'ทั้งหมด') {
      items = items.filter(r => r.mediaType === filters.mediaType);
    }
    if (filters?.searchTerm && filters.searchTerm.trim() !== '') {
      const term = filters.searchTerm.trim().toLowerCase();
      items = items.filter(r => 
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term) ||
        r.authorName.toLowerCase().includes(term) ||
        (r.tags && r.tags.some(t => t.toLowerCase().includes(term)))
      );
    }

    // Sort by createdAt descending
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'resources');
  }
}

// Fetch all resources including hidden ones for admin/moderator
export async function fetchAllResourcesForAdmin(): Promise<ResourceItem[]> {
  try {
    const colRef = collection(db, 'resources');
    const snapshot = await getDocs(colRef);
    const items = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as ResourceItem));
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'resources');
  }
}

// Increment resource view count
export async function incrementResourceView(resourceId: string): Promise<void> {
  try {
    const docRef = doc(db, 'resources', resourceId);
    await updateDoc(docRef, {
      viewsCount: increment(1)
    });
  } catch (err) {
    // Non-blocking error for view counter
    console.warn('Failed to increment view count:', err);
  }
}

// Create new resource
export async function createResource(data: Omit<ResourceItem, 'id' | 'viewsCount' | 'favoritesCount' | 'createdAt'>): Promise<string> {
  try {
    const id = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, 'resources', id);
    const newResource: ResourceItem = {
      ...data,
      id,
      viewsCount: 0,
      favoritesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, newResource);
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'resources');
  }
}

// Update existing resource
export async function updateResource(
  resourceId: string, 
  data: Partial<ResourceItem>, 
  adminLog?: { performedBy: string; email: string; reason?: string }
): Promise<void> {
  try {
    const docRef = doc(db, 'resources', resourceId);
    const payload = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, payload);

    if (adminLog) {
      await logModerationAction({
        action: data.status === 'hidden' ? 'hide_resource' : 'update_resource',
        targetId: resourceId,
        targetType: 'resource',
        performedBy: adminLog.performedBy,
        performedByEmail: adminLog.email,
        details: adminLog.reason || `Updated resource properties: ${Object.keys(data).join(', ')}`
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `resources/${resourceId}`);
  }
}

// Delete resource
export async function deleteResource(
  resourceId: string, 
  adminLog?: { performedBy: string; email: string; reason?: string }
): Promise<void> {
  try {
    const docRef = doc(db, 'resources', resourceId);
    await deleteDoc(docRef);

    if (adminLog) {
      await logModerationAction({
        action: 'delete_resource',
        targetId: resourceId,
        targetType: 'resource',
        performedBy: adminLog.performedBy,
        performedByEmail: adminLog.email,
        details: adminLog.reason || 'Resource deleted by moderator'
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `resources/${resourceId}`);
  }
}

// Toggle Favorite (Idempotent: userId_resourceId)
export async function toggleFavorite(userId: string, resourceId: string): Promise<boolean> {
  const favDocId = `${userId}_${resourceId}`;
  const favDocRef = doc(db, 'favorites', favDocId);
  const resDocRef = doc(db, 'resources', resourceId);

  try {
    const favSnap = await getDoc(favDocRef);
    if (favSnap.exists()) {
      // Remove favorite
      await deleteDoc(favDocRef);
      await updateDoc(resDocRef, {
        favoritesCount: increment(-1)
      });
      return false; // Not favorited anymore
    } else {
      // Add favorite
      await setDoc(favDocRef, {
        id: favDocId,
        userId,
        resourceId,
        createdAt: new Date().toISOString()
      });
      await updateDoc(resDocRef, {
        favoritesCount: increment(1)
      });
      return true; // Favorited
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `favorites/${favDocId}`);
  }
}

// Get user's favorited resource IDs
export async function fetchUserFavoriteIds(userId: string): Promise<string[]> {
  try {
    const colRef = collection(db, 'favorites');
    const q = query(colRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => (d.data() as FavoriteItem).resourceId);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'favorites');
  }
}

// Submit violation report
export async function submitReport(report: {
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterEmail: string;
  reason: ReportReason;
  details: string;
}): Promise<void> {
  try {
    const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const docRef = doc(db, 'reports', id);
    const newReport: ReportItem = {
      ...report,
      id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, newReport);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'reports');
  }
}

// Fetch reports for admin
export async function fetchReports(): Promise<ReportItem[]> {
  try {
    const colRef = collection(db, 'reports');
    const snapshot = await getDocs(colRef);
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ReportItem));
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'reports');
  }
}

// Resolve or dismiss report
export async function updateReportStatus(
  reportId: string, 
  status: 'resolved' | 'dismissed', 
  moderatorId: string
): Promise<void> {
  try {
    const docRef = doc(db, 'reports', reportId);
    await updateDoc(docRef, {
      status,
      resolvedAt: new Date().toISOString(),
      resolvedBy: moderatorId
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
  }
}

// Log moderation actions
export async function logModerationAction(log: Omit<ModerationLogItem, 'id' | 'createdAt'>): Promise<void> {
  try {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const docRef = doc(db, 'moderationLogs', id);
    await setDoc(docRef, {
      ...log,
      id,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Could not record moderation log:', err);
  }
}

// Fetch moderation logs
export async function fetchModerationLogs(): Promise<ModerationLogItem[]> {
  try {
    const colRef = collection(db, 'moderationLogs');
    const snapshot = await getDocs(colRef);
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ModerationLogItem));
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'moderationLogs');
  }
}

// Fetch all registered users for admin
export async function fetchAllUsers(): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as UserProfile));
    items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'users');
  }
}

// Update user role or account status
export async function updateUserRoleOrStatus(
  targetUserId: string,
  updates: { role?: string; status?: 'active' | 'suspended' },
  adminInfo: { uid: string; email: string }
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', targetUserId);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    await logModerationAction({
      action: updates.status ? `user_${updates.status}` : `role_to_${updates.role}`,
      targetId: targetUserId,
      targetType: 'user',
      performedBy: adminInfo.uid,
      performedByEmail: adminInfo.email,
      details: JSON.stringify(updates)
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${targetUserId}`);
  }
}
