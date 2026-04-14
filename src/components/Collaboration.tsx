import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  ChevronRight, 
  UserCircle2, 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  Mail, 
  Lock,
  MessageCircle,
  History,
  Clock,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import { Collaboration as CollaborationType, Comment as CommentType } from '../types';
import { sendToFormspree } from '../lib/formspree';

interface CollaborationProps {
  onCancel: () => void;
}

type CollaborationView = 'landing' | 'peer_form' | 'supervisor_form' | 'detail';

export default function Collaboration({ onCancel }: CollaborationProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<CollaborationView>('landing');
  const [selectedCollab, setSelectedCollab] = useState<CollaborationType | null>(null);
  const [email, setEmail] = useState('');
  const [reflection, setReflection] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  
  const [myInvitations, setMyInvitations] = useState<CollaborationType[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<CollaborationType[]>([]);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Listen for invitations
  useEffect(() => {
    if (!user?.email) return;

    const myQuery = query(
      collection(db, 'collaborations'),
      where('senderEmail', '==', user.email),
      orderBy('createdAt', 'desc')
    );

    const receivedQuery = query(
      collection(db, 'collaborations'),
      where('recipientEmail', '==', user.email),
      orderBy('createdAt', 'desc')
    );

    const unsubMy = onSnapshot(myQuery, (snapshot) => {
      setMyInvitations(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CollaborationType)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'collaborations'));

    const unsubReceived = onSnapshot(receivedQuery, (snapshot) => {
      setReceivedInvitations(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CollaborationType)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'collaborations'));

    return () => {
      unsubMy();
      unsubReceived();
    };
  }, [user]);

  // Listen for comments when a collaboration is selected
  useEffect(() => {
    if (!selectedCollab) return;

    const commentsQuery = query(
      collection(db, `collaborations/${selectedCollab.id}/comments`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CommentType)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `collaborations/${selectedCollab.id}/comments`));

    return () => unsubscribe();
  }, [selectedCollab]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !reflection || !user) return;
    
    setIsSending(true);
    try {
      const collabData = {
        senderId: user.uid,
        senderEmail: user.email,
        senderName: user.displayName || 'Anonymous',
        recipientEmail: email,
        content: reflection,
        type: view === 'peer_form' ? 'peer' : 'supervisor',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'collaborations'), collabData);
      
      // Send to Formspree
      sendToFormspree({
        formType: 'Collaboration Invitation',
        ...collabData
      });
      
      setIsSending(false);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setView('landing');
        setEmail('');
        setReflection('');
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'collaborations');
      setIsSending(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedCollab || !user) return;

    setIsPostingComment(true);
    try {
      const commentData = {
        collaborationId: selectedCollab.id,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        text: newComment,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, `collaborations/${selectedCollab.id}/comments`), commentData);
      
      // Send to Formspree
      sendToFormspree({
        formType: 'Collaboration Comment',
        ...commentData
      });
      
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `collaborations/${selectedCollab.id}/comments`);
    } finally {
      setIsPostingComment(false);
    }
  };

  const updateStatus = async (id: string, status: 'accepted' | 'declined') => {
    try {
      await updateDoc(doc(db, 'collaborations', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `collaborations/${id}`);
    }
  };

  const deleteInvitation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) return;
    try {
      await deleteDoc(doc(db, 'collaborations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `collaborations/${id}`);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mx-auto text-brand-600">
          <Lock className="w-12 h-12" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold dark:text-white">{t('connect_for_collaboration')}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t('collaboration_login_desc')}
          </p>
        </div>
        <button 
          onClick={handleLogin}
          className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:bg-brand-700 transition-all flex items-center gap-3 mx-auto"
        >
          <Users className="w-6 h-6" />
          Sign in with Google
        </button>
      </div>
    );
  }

  const renderForm = (type: 'peer' | 'supervisor') => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl"
    >
      <button 
        onClick={() => setView('landing')}
        className="flex items-center gap-2 text-slate-400 hover:text-brand-600 transition-colors mb-6 font-bold"
      >
        <ArrowLeft className="w-5 h-5" /> {t('back_to_collaboration')}
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${type === 'peer' ? 'bg-brand-50 text-brand-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {type === 'peer' ? <MessageSquare className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
        </div>
        <div>
          <h2 className="text-2xl font-bold dark:text-white">
            {type === 'peer' ? t('peer_reflection') : t('supervisor_reflection')}
          </h2>
          <p className="text-sm text-slate-400">Send an invitation to collaborate on your reflection.</p>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('recipient_email')}</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="email" 
              required
              placeholder="colleague@example.com"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-brand-400 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('write_reflection')}</label>
          <textarea 
            required
            placeholder={t('reflection_placeholder')}
            className="w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-brand-400 outline-none transition-all min-h-[200px] resize-none"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />
        </div>

        <button 
          type="submit"
          disabled={isSending || sent}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg ${sent ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-brand-600 text-white hover:bg-slate-800 dark:hover:bg-brand-700'}`}
        >
          {sent ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {t('invitation_sent')}
            </>
          ) : isSending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              {t('send_invitation')}
            </>
          )}
        </button>
      </form>
    </motion.div>
  );

  const renderDetail = () => {
    if (!selectedCollab) return null;
    const isSender = selectedCollab.senderEmail === user.email;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <button 
          onClick={() => {
            setView('landing');
            setSelectedCollab(null);
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-brand-600 transition-colors font-bold"
        >
          <ArrowLeft className="w-5 h-5" /> {t('back_to_collaboration')}
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedCollab.type === 'peer' ? 'bg-brand-100 text-brand-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {selectedCollab.type}
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(selectedCollab.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                selectedCollab.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 
                selectedCollab.status === 'declined' ? 'bg-red-100 text-red-600' : 
                'bg-amber-100 text-amber-600'
              }`}>
                {selectedCollab.status}
              </div>
            </div>
            <h2 className="text-2xl font-bold dark:text-white mb-2">
              {isSender ? `Sent to: ${selectedCollab.recipientEmail}` : `From: ${selectedCollab.senderName}`}
            </h2>
          </div>

          <div className="p-8 space-y-8">
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedCollab.content}
              </p>
            </div>

            {!isSender && selectedCollab.status === 'pending' && (
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => updateStatus(selectedCollab.id, 'accepted')}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all"
                >
                  {t('accept')}
                </button>
                <button 
                  onClick={() => updateStatus(selectedCollab.id, 'declined')}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  {t('decline')}
                </button>
              </div>
            )}

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
              <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-brand-500" />
                {t('comments')}
              </h3>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 italic">{t('no_comments')}</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className={`flex gap-4 ${comment.authorId === user.uid ? 'flex-row-reverse' : ''}`}>
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <UserCircle2 className="w-6 h-6" />
                      </div>
                      <div className={`max-w-[80%] p-4 rounded-2xl ${
                        comment.authorId === user.uid 
                          ? 'bg-brand-600 text-white rounded-tr-none' 
                          : 'bg-slate-50 dark:bg-slate-800 dark:text-white rounded-tl-none'
                      }`}>
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="text-[10px] font-bold opacity-70 uppercase">{comment.authorName}</span>
                          <span className="text-[10px] opacity-50">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handlePostComment} className="flex gap-2 pt-4">
                <input 
                  type="text"
                  placeholder={t('add_comment')}
                  className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-brand-400 outline-none transition-all"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={isPostingComment || !newComment.trim()}
                  className="bg-brand-600 text-white px-6 rounded-2xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <header className="space-y-2">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Users className="w-10 h-10 text-brand-600" />
                {t('collaboration')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                Connect with peers and supervisors for shared growth and feedback.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Peer Reflection Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{t('peer_reflection')}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                  Share your teaching experiences with fellow trainees. Give and receive constructive feedback to improve together.
                </p>
                <button 
                  onClick={() => setView('peer_form')}
                  className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-600 hover:text-white transition-all"
                >
                  Open Peer Portal <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>

              {/* Supervisor Reflection Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{t('supervisor_reflection')}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                  Submit your reflections for official review. Get expert guidance and professional development insights from your mentors.
                </p>
                <button 
                  onClick={() => setView('supervisor_form')}
                  className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all"
                >
                  Contact Supervisor <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            </div>

            {/* Invitations Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Received Invitations */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-brand-500" />
                  {t('invitations_received')}
                </h3>
                <div className="space-y-4">
                  {receivedInvitations.length === 0 ? (
                    <p className="text-center py-12 text-slate-400 italic">No invitations received yet.</p>
                  ) : (
                    receivedInvitations.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${inv.type === 'peer' ? 'bg-brand-100 text-brand-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {inv.type === 'peer' ? <MessageSquare className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold dark:text-white truncate">{inv.senderName}</p>
                          <p className="text-xs text-slate-400 truncate">{inv.senderEmail}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedCollab(inv);
                            setView('detail');
                          }}
                          className="p-2 text-slate-400 hover:text-brand-600 transition-colors"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sent Invitations */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                  <History className="w-6 h-6 text-brand-500" />
                  {t('my_sent_invitations')}
                </h3>
                <div className="space-y-4">
                  {myInvitations.length === 0 ? (
                    <p className="text-center py-12 text-slate-400 italic">You haven't sent any invitations yet.</p>
                  ) : (
                    myInvitations.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold dark:text-white truncate">{inv.recipientEmail}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 
                              inv.status === 'declined' ? 'bg-red-100 text-red-600' : 
                              'bg-amber-100 text-amber-600'
                            }`}>
                              {inv.status}
                            </span>
                            <span className="text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedCollab(inv);
                              setView('detail');
                            }}
                            className="p-2 text-slate-400 hover:text-brand-600 transition-colors"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => deleteInvitation(inv.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : view === 'detail' ? (
          renderDetail()
        ) : (
          renderForm(view === 'peer_form' ? 'peer' : 'supervisor')
        )}
      </AnimatePresence>
    </div>
  );
}
