'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateProposal } from '@/hooks/useProposals';
import { FileUp, Sparkles, Building2, Calendar, Mail, DollarSign } from 'lucide-react';

interface NewProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProposalModal: React.FC<NewProposalModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const createMutation = useCreateProposal();

  const [title, setTitle] = useState('');
  const [customer, setCustomer] = useState('');
  const [deadline, setDeadline] = useState('2026-10-24');
  const [senderAddress, setSenderAddress] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !customer.trim()) {
      setError('Please provide proposal title and customer name.');
      return;
    }

    try {
      const newProp = await createMutation.mutateAsync({
        title: title.trim(),
        customer: customer.trim(),
        deadline: deadline || '2026-10-24',
        owner: 'Sarah Jenkins',
        sender_address: senderAddress.trim() || 'procurement@client.com',
        estimated_value: estimatedValue.trim() || '$250,000',
        raw_content: rawContent.trim(),
      });

      onClose();
      // Reset form
      setTitle('');
      setCustomer('');
      setRawContent('');
      setError('');
      router.push(`/proposals/${newProp.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create proposal.');
    }
  };

  const handleFillTemplate = (type: 'cloud' | 'security') => {
    if (type === 'cloud') {
      setTitle('Kubernetes Cloud Optimization & Migration RFP');
      setCustomer('Vanguard Systems Corp');
      setSenderAddress('rfp-desk@vanguardsys.com');
      setEstimatedValue('$480,000');
      setDeadline('2026-11-05');
      setRawContent(
        'Vanguard Systems seeks a validated partner to migrate our core transactional ledger to AWS Kubernetes with multi-region high availability, SOC 2 compliance, and zero-downtime database cutover.'
      );
    } else {
      setTitle('Enterprise Identity Governance & FedRAMP Attestation');
      setCustomer('AeroTech Federal');
      setSenderAddress('procurement@aerotech-fed.gov');
      setEstimatedValue('$620,000');
      setDeadline('2026-11-12');
      setRawContent(
        'AeroTech Federal requires full NIST 800-53 rev 5 compliance, Okta SAML 2.0 federation with SCIM directory provisioning, and immutable append-only audit log archiving.'
      );
    }
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Proposal Request"
      description="Ingest incoming RFP text or inquiry body to initiate AI requirement extraction."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Sample Presets */}
        <div className="p-3 bg-[#EEF0F3] rounded-xl border border-[#E2E5E9] flex items-center justify-between">
          <span className="text-xs text-gray-600 font-medium">Quick sample RFP:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleFillTemplate('cloud')}
              className="text-xs px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-blue-700 font-medium transition-colors shadow-sm"
            >
              Cloud Migration
            </button>
            <button
              type="button"
              onClick={() => handleFillTemplate('security')}
              className="text-xs px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-blue-700 font-medium transition-colors shadow-sm"
            >
              Security Governance
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Proposal Title *"
            placeholder="e.g. Cloud Infrastructure RFP"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Customer / Client *"
            placeholder="e.g. Acme Corporation"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            required
            leftIcon={<Building2 className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Input
            label="Submission Deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            leftIcon={<Calendar className="w-3.5 h-3.5" />}
          />
          <Input
            label="Client Contact / Sender"
            placeholder="procurement@client.com"
            value={senderAddress}
            onChange={(e) => setSenderAddress(e.target.value)}
            leftIcon={<Mail className="w-3.5 h-3.5" />}
          />
          <Input
            label="Est. Contract Value"
            placeholder="$350,000"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            leftIcon={<DollarSign className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            RFP Content / Inquiry Text
          </label>
          <div className="rounded-xl shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]">
            <textarea
              rows={4}
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Paste RFP specification text, email inquiry, or extracted requirements here..."
              className="w-full bg-white text-gray-900 placeholder:text-gray-400 text-sm rounded-xl border border-[#E2E5E9] p-3 transition-all duration-150 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <p className="text-[11px] text-gray-500">
            Lunova will process this content against indexed knowledge documents to extract requirements and draft responses.
          </p>
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <div className="pt-3 border-t border-[#E2E5E9] flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={createMutation.isPending}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Create Proposal
          </Button>
        </div>
      </form>
    </Modal>
  );
};
