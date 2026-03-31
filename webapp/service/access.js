function normalizeAccess(value) {
  return value === 'private' || value === 'public' ? value : 'personal';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getSharing(bracket) {
  const raw = bracket?.sharing || bracket?.draft?.sharing || {};
  const collaboratorEmails = Array.isArray(raw.collaboratorEmails)
    ? raw.collaboratorEmails.map(normalizeEmail).filter(Boolean)
    : [];

  return {
    editAccess: normalizeAccess(raw.editAccess),
    viewAccess: normalizeAccess(raw.viewAccess),
    collaboratorEmails,
    shareLink: String(raw.shareLink || ''),
  };
}

function isOwner(user, bracket) {
  return Boolean(user && bracket && user.id === bracket.ownerId);
}

function isCollaborator(user, bracket) {
  if (!user) return false;
  const sharing = getSharing(bracket);
  return sharing.collaboratorEmails.includes(normalizeEmail(user.email));
}

function canViewBracket(user, bracket) {
  if (!user || !bracket) return false;
  if (isOwner(user, bracket)) return true;

  const sharing = getSharing(bracket);
  if (sharing.viewAccess === 'public') return true;
  if (sharing.viewAccess === 'private' && isCollaborator(user, bracket)) return true;

  if (sharing.editAccess === 'public') return true;
  if (sharing.editAccess === 'private' && isCollaborator(user, bracket)) return true;

  return false;
}

function canEditBracket(user, bracket) {
  if (!user || !bracket) return false;
  if (isOwner(user, bracket)) return true;

  const sharing = getSharing(bracket);
  if (sharing.editAccess === 'public') return true;
  if (sharing.editAccess === 'private' && isCollaborator(user, bracket)) return true;

  return false;
}

function describeAccess(user, bracket) {
  return {
    canView: canViewBracket(user, bracket),
    canEdit: canEditBracket(user, bracket),
    isOwner: isOwner(user, bracket),
    isCollaborator: isCollaborator(user, bracket),
    sharing: getSharing(bracket),
  };
}

module.exports = {
  getSharing,
  canViewBracket,
  canEditBracket,
  describeAccess,
};
