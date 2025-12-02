# Knowledge Base Size Limits Update

## Summary
Changed Knowledge Base limits from document count to total storage size limits.

## New Limits

| Tier | Storage Limit |
|------|---------------|
| Free | 5 KB total |
| Starter | 5 MB total |
| Founders Club | 10 MB total |
| Enterprise | Unlimited |

## Changes Made

### 1. `app/src/constants/planConfig.js`
- Changed `kbLimit` (document count) to `kbSizeLimit` (bytes)
- Added constants for size limits:
  - `FREE: 5 * 1024` (5 KB = 5,120 bytes)
  - `STARTER: 5 * 1024 * 1024` (5 MB = 5,242,880 bytes)
  - `FOUNDERS: 10 * 1024 * 1024` (10 MB = 10,485,760 bytes)
- Enterprise remains unlimited (infinity)

### 2. `app/src/hooks/useKnowledgeBase.js`
- Changed from `maxDocuments` to `maxSizeBytes`
- Added `totalSize` calculation (sum of all document sizes)
- Updated `limitReached` to check total size instead of document count
- Added `wouldExceedLimit()` function to check if adding a file would exceed limit
- Enhanced error messages to show remaining storage and file size
- Maintained backward compatibility with old `maxDocuments` API

### 3. `app/src/components/KnowledgeBaseModal.jsx`
- Updated to accept `maxSizeBytes` and `totalSize` instead of `maxDocuments`
- Changed display from "X/Y docs used" to "X MB / Y MB" format
- Updated entitlement check to use `kbSizeLimit` instead of `kbLimit`
- Updated error messages to reference "storage limit" instead of "document cap"
- Fixed `formatBytes` function to handle edge cases

### 4. `app/src/App.jsx`
- Updated to use `kbSizeLimit` instead of `kbLimit`
- Changed `useKnowledgeBase` call to pass `maxSizeBytes` instead of `maxDocuments`
- Updated props passed to `KnowledgeBaseModal` to include `totalSize` and `maxSizeBytes`

### 5. `app/src/hooks/useEntitlements.js`
- Updated `canAccessKnowledgeBase` to check both `kbSizeLimit` (new) and `kbLimit` (old) for backward compatibility

### 6. `app/src/components/PaymentModal.jsx`
- Updated Starter tier feature: "10 knowledge base documents" → "5 MB knowledge base storage"
- Updated Founders tier feature: "20 knowledge base documents" → "10 MB knowledge base storage"

### 7. `app/src/components/PricingModal.jsx`
- Updated Free tier: "3 KB documents" → "5 KB knowledge base storage"
- Updated Starter tier: "10 KB documents" → "5 MB knowledge base storage"
- Updated Founders tier: "20 KB documents" → "10 MB knowledge base storage"
- Updated limitations text accordingly

## Backward Compatibility

The system maintains backward compatibility:
- Old code using `maxDocuments` will still work (treated as unlimited size)
- `useEntitlements` checks both `kbSizeLimit` and `kbLimit`
- Existing documents in Firestore will continue to work

## Testing Checklist

- [ ] Free tier user can upload documents up to 5 KB total
- [ ] Free tier user sees error when trying to exceed 5 KB
- [ ] Starter tier user can upload documents up to 5 MB total
- [ ] Starter tier user sees error when trying to exceed 5 MB
- [ ] Founders tier user can upload documents up to 10 MB total
- [ ] Founders tier user sees error when trying to exceed 10 MB
- [ ] Enterprise tier user has unlimited storage
- [ ] Size display shows correct format (e.g., "2.5 MB / 5 MB")
- [ ] Error messages show remaining storage and file size
- [ ] PaymentModal shows correct size limits
- [ ] PricingModal shows correct size limits

## Migration Notes

Existing users with documents will need to:
1. Their existing documents will continue to work
2. New uploads will be checked against total size limit
3. If they exceed their new limit, they'll need to delete some documents or upgrade

No data migration is required - the system calculates total size from existing document sizes in Firestore.

