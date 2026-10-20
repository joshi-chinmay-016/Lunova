'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GeneratedProposalResponse, ProposalRequirement } from '@/types/proposal';
import {
  FileText,
  Edit2,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  BookOpen,
  Eye,
  AlertCircle
} from 'lucide-react';

interface ResponseEditorProps {
  initialResponse?: GeneratedProposalResponse;
  requirements?: ProposalRequirement[];
  onSaveDraft: (updated: GeneratedProposalResponse) => Promise<void>;
  onApprove: () => void;
  onReject: () => void;
  onRequestRegenerate: () => void;
  isSaving?: boolean;
  status: string;
}

export const ResponseEditor: React.FC<ResponseEditorProps> = ({
  initialResponse,
  requirements = [],
  onSaveDraft,
  onApprove,
  onReject,
  onRequestRegenerate,
  isSaving = false,
  status,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'summary' | 'technical' | 'plan' | 'requirements'>('all');

  const [execSummary, setExecSummary] = useState(
    initialResponse?.executive_summary ||
      'No executive summary generated yet. Run AI analysis to synthesize proposal response.'
  );
  const [techApproach, setTechApproach] = useState(
    initialResponse?.technical_approach ||
      'Technical approach will detail architectural topology, compliance guarantees, and IaC blueprints.'
  );
  const [implPlan, setImplPlan] = useState(
    initialResponse?.implementation_plan ||
      'Implementation plan outlines key phase deliverables, security milestones, and production go-live timelines.'
  );
  const [reqResponses, setReqResponses] = useState(initialResponse?.requirement_responses || []);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (initialResponse) {
      setExecSummary(initialResponse.executive_summary || '');
      setTechApproach(initialResponse.technical_approach || '');
      setImplPlan(initialResponse.implementation_plan || '');
      setReqResponses(initialResponse.requirement_responses || []);
    }
  }, [initialResponse]);

  const handleSave = async () => {
    const updated: GeneratedProposalResponse = {
      executive_summary: execSummary,
      technical_approach: techApproach,
      implementation_plan: implPlan,
      requirement_responses: reqResponses,
    };
    await onSaveDraft(updated);
    setHasUnsavedChanges(false);
    setIsEditing(false);
  };

  const handleReqResponseChange = (reqId: string, val: string) => {
    setReqResponses((prev) =>
      prev.map((r) => (r.requirement_id === reqId ? { ...r, response: val } : r))
    );
    setHasUnsavedChanges(true);
  };

  return (
    <Card className="border-t-4 border-t-blue-600">
      {/* Workspace Header */}
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">Generated Proposal Response</h3>
              {hasUnsavedChanges && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Unsaved edits
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              Professional document editor • Grounded in tenant knowledge
            </p>
          </div>
        </div>

        {/* Section view switcher & edit toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={isEditing ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            leftIcon={isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
          >
            {isEditing ? 'Preview Mode' : 'Edit Document'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRequestRegenerate}
            title="Re-run AI extraction and response synthesis"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Regenerate
          </Button>
        </div>
      </CardHeader>

      {/* Editor Body */}
      <CardContent className="space-y-6">
        {/* Section 1: Executive Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              1. Executive Summary
            </h4>
            <span className="text-[10px] text-gray-400 font-mono">Overview & Value Proposition</span>
          </div>

          {isEditing ? (
            <textarea
              rows={4}
              value={execSummary}
              onChange={(e) => {
                setExecSummary(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full bg-white text-gray-900 text-xs sm:text-sm rounded-xl border border-[#E2E5E9] p-3.5 leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
            />
          ) : (
            <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200 text-xs sm:text-sm text-gray-800 leading-relaxed font-sans shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]">
              {execSummary}
            </div>
          )}
        </div>

        {/* Section 2: Technical Approach */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              2. Technical Approach & Architecture
            </h4>
            <span className="text-[10px] text-gray-400 font-mono">Infrastructure & Security</span>
          </div>

          {isEditing ? (
            <textarea
              rows={4}
              value={techApproach}
              onChange={(e) => {
                setTechApproach(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full bg-white text-gray-900 text-xs sm:text-sm rounded-xl border border-[#E2E5E9] p-3.5 leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
            />
          ) : (
            <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200 text-xs sm:text-sm text-gray-800 leading-relaxed font-sans shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]">
              {techApproach}
            </div>
          )}
        </div>

        {/* Section 3: Implementation Plan */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              3. Implementation Plan & Milestones
            </h4>
            <span className="text-[10px] text-gray-400 font-mono">Phases & Delivery Timelines</span>
          </div>

          {isEditing ? (
            <textarea
              rows={4}
              value={implPlan}
              onChange={(e) => {
                setImplPlan(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full bg-white text-gray-900 text-xs sm:text-sm rounded-xl border border-[#E2E5E9] p-3.5 leading-relaxed whitespace-pre-line focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
            />
          ) : (
            <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200 text-xs sm:text-sm text-gray-800 leading-relaxed font-sans whitespace-pre-line shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]">
              {implPlan}
            </div>
          )}
        </div>

        {/* Section 4: Requirement-by-Requirement Responses */}
        {reqResponses && reqResponses.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                4. Requirement-by-Requirement Specific Responses
              </h4>
              <span className="text-[10px] text-gray-400 font-mono">
                {reqResponses.length} Itemized Responses
              </span>
            </div>

            <div className="space-y-3">
              {reqResponses.map((item, idx) => {
                const reqMeta = requirements.find((r) => r.requirement_id === item.requirement_id);
                return (
                  <div
                    key={item.requirement_id || idx}
                    className="p-3.5 rounded-xl bg-white border border-[#E2E5E9] space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-900">
                        {reqMeta?.description || `Requirement ${item.requirement_id}`}
                      </span>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {item.requirement_id}
                      </span>
                    </div>

                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={item.response}
                        onChange={(e) =>
                          handleReqResponseChange(item.requirement_id, e.target.value)
                        }
                        className="w-full bg-white text-gray-900 text-xs rounded-lg border border-gray-300 p-2.5 leading-relaxed focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {item.response}
                      </p>
                    )}

                    {item.grounded_in && item.grounded_in.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                        <BookOpen className="w-3 h-3 text-blue-600" />
                        <span>Grounded in: {item.grounded_in.join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Human Review & Approval Action Footer */}
      <CardFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/90">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>All AI responses require human review before client submission.</span>
        </div>

        <div className="flex items-center gap-2.5 justify-end">
          {hasUnsavedChanges || isEditing ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Draft
            </Button>
          ) : (
            <>
              {status !== 'REJECTED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReject}
                  className="text-red-700 hover:bg-red-50 hover:border-red-300"
                >
                  Decline Proposal
                </Button>
              )}

              {status !== 'APPROVED' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={onApprove}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Approve Response
                </Button>
              )}
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
