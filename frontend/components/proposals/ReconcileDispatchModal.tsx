'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useReconcileProposal } from '@/hooks/useProposals';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';

interface ReconcileDispatchModalProps {
  proposalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReconcileDispatchModal: React.FC<ReconcileDispatchModalProps> = ({
  proposalId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const reconcileMutation = useReconcileProposal();

  const [action, setAction] = useState<'CONFIRM_DELIVERED' | 'RESET_FOR_RESEND'>('CONFIRM_DELIVERED');
  const [notes, setNotes] = useState('');
  const [externalMessageId, setExternalMessageId] = useState('');
  const [hasVerifiedOutOfBand, setHasVerifiedOutOfBand] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasVerifiedOutOfBand) {
      setErrorMessage('You must confirm independent out-of-band verification before submitting.');
      return;
    }

    if (!notes.trim() || notes.trim().length < 8) {
      setErrorMessage('Please provide meaningful reviewer notes explaining your findings (at least 8 characters).');
      return;
    }

    try {
      await reconcileMutation.mutateAsync({
        id: proposalId,
        payload: {
          action,
          notes: notes.trim(),
          external_message_id: externalMessageId.trim() || undefined,
        },
      });

      // Reset form state
      setNotes('');
      setExternalMessageId('');
      setHasVerifiedOutOfBand(false);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Reconciliation failed. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reconcile Uncertain Dispatch"
      description="Resolve an uncertain Gmail delivery outcome following network timeout or interruption."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-amber-900">
            <p className="font-semibold">Uncertain Delivery Protection Active</p>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              A network timeout occurred during dispatch. Google Gmail may or may not have received and delivered this message. Automated resending was stopped to prevent accidental duplicate customer emails.
            </p>
          </div>
        </div>

        {/* Action Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-900">
            Reconciliation Resolution Action
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setAction('CONFIRM_DELIVERED')}
              className={`p-3 rounded-xl border text-left transition-all ${
                action === 'CONFIRM_DELIVERED'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Confirm Delivered</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-normal">
                Verified delivery in Gmail Sent folder. Mark status as SENT.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAction('RESET_FOR_RESEND')}
              className={`p-3 rounded-xl border text-left transition-all ${
                action === 'RESET_FOR_RESEND'
                  ? 'border-blue-500 bg-blue-50/50 text-blue-950 ring-1 ring-blue-500'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs mb-1">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span>Reset For Resend</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-normal">
                Confirmed message was NOT delivered. Reset status to APPROVED.
              </p>
            </button>
          </div>
        </div>

        {/* Optional External Message ID for Delivered */}
        {action === 'CONFIRM_DELIVERED' && (
          <Input
            label="Gmail Message ID (Optional)"
            placeholder="e.g. 18bb208d1f2e..."
            value={externalMessageId}
            onChange={(e) => setExternalMessageId(e.target.value)}
            hint="If visible in the Google Workspace / Gmail web interface."
          />
        )}

        {/* Reviewer Notes (Mandatory) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-900">
            Mandatory Verification Notes <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document evidence: checked Gmail Sent folder, contacted recipient, or verified API logs..."
            className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-[11px] text-gray-500">
            This note will be recorded into the tamper-evident immutable ProposalAuditLog.
          </p>
        </div>

        {/* Independent Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={hasVerifiedOutOfBand}
              onChange={(e) => setHasVerifiedOutOfBand(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[11px] text-gray-700 leading-relaxed">
              I have independently verified through external communication or Gmail sent records that this action is accurate and will not cause duplicate client emails.
            </span>
          </label>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={action === 'CONFIRM_DELIVERED' ? 'success' : 'primary'}
            size="sm"
            type="submit"
            isLoading={reconcileMutation.isPending}
            disabled={!hasVerifiedOutOfBand || notes.trim().length < 8}
          >
            {action === 'CONFIRM_DELIVERED' ? 'Confirm as Delivered' : 'Reset to Approved'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
