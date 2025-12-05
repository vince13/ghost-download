#!/bin/bash

# Script to clean up mounted DMG volumes before building
# Usage: ./scripts/cleanup-dmg.sh

echo "🧹 Cleaning up any mounted DMG volumes..."

# Get all mounted ghost volumes (handles various naming patterns)
# Method 1: Extract from hdiutil info (more reliable)
VOLUMES=$(hdiutil info 2>/dev/null | grep -i "ghost" | grep -o "/Volumes/[^ ]*" | sort -u)

# Method 2: Also check diskutil
DISKUTIL_VOLUMES=$(diskutil list 2>/dev/null | grep -i "ghost" | grep -o "/Volumes/[^ ]*" | sort -u)

# Method 3: Direct check for common volume names (including electron-builder patterns)
DIRECT_VOLUMES=""
# Check for any volume starting with "ghost" or "Ghost Protocol"
# Also check for electron-builder patterns like "ghost 0.1.1-arm64"
for vol_path in /Volumes/*; do
  vol_name=$(basename "$vol_path")
  if [[ "$vol_name" =~ ^[Gg]host ]] || [[ "$vol_name" =~ "ghost" ]] || [[ "$vol_name" =~ "Ghost" ]] || [[ "$vol_name" =~ "0.1" ]]; then
    if [ -d "$vol_path" ]; then
      DIRECT_VOLUMES="$DIRECT_VOLUMES $vol_path"
    fi
  fi
done

# Combine and deduplicate, filter out empty lines
ALL_VOLUMES=$(echo -e "$VOLUMES\n$DISKUTIL_VOLUMES\n$DIRECT_VOLUMES" | grep "^/Volumes/" | sort -u | tr '\n' ' ')

if [ -z "$ALL_VOLUMES" ] || [ "$ALL_VOLUMES" = "" ]; then
  echo "✅ No ghost volumes found to unmount"
else
  for volume in $ALL_VOLUMES; do
    # Remove any trailing whitespace
    volume=$(echo "$volume" | xargs)
    if [ -n "$volume" ] && [ -d "$volume" ]; then
      echo "  Unmounting: $volume"
      # Try multiple methods to unmount, with error suppression
      # First try gentle unmount
      hdiutil detach "$volume" 2>/dev/null || \
      diskutil unmount "$volume" 2>/dev/null || true
      
      # Wait a moment
      sleep 0.5
      
      # If still mounted, try force unmount
      if [ -d "$volume" ]; then
        echo "    Trying force unmount..."
        hdiutil detach "$volume" -force 2>/dev/null || \
        diskutil unmount force "$volume" 2>/dev/null || \
        echo "    ⚠️  Could not unmount $volume (may need manual eject from Finder)" || true
      fi
    fi
  done
  
  # Wait a moment for unmount to complete
  sleep 1
  
  # Verify they're unmounted
  REMAINING=$(hdiutil info | grep -i "ghost" | grep -o "/Volumes/[^ ]*" | sort -u)
  if [ -z "$REMAINING" ]; then
    echo "✅ All ghost volumes cleaned up"
  else
    echo "⚠️  Some volumes may still be mounted: $REMAINING"
    echo "   You may need to manually eject them from Finder"
  fi
fi

# Also check for any DMG files that might be locked
if [ -d "app/dist" ]; then
  echo "📁 Checking for DMG files in app/dist..."
  find app/dist -name "*.dmg" -exec echo "  Found: {}" \; 2>/dev/null || true
fi

# Final aggressive cleanup - try to unmount any remaining ghost volumes
# This handles volumes that electron-builder might create during the build
echo "🔍 Final check for any remaining ghost volumes..."
FINAL_CHECK=$(hdiutil info 2>/dev/null | grep -i "ghost" | grep -o "/Volumes/[^ ]*" | sort -u)
if [ -n "$FINAL_CHECK" ]; then
  echo "$FINAL_CHECK" | while read -r vol; do
    if [ -d "$vol" ]; then
      echo "  Force unmounting: $vol"
      hdiutil detach "$vol" -force 2>/dev/null || true
      sleep 0.3
    fi
  done
fi

echo ""
echo "✅ Cleanup complete. You can now run: cd app && npm run electron:build:mac"

