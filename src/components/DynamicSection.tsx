import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@common/ui/card';
import { Button } from '@common/ui/button';
import { Plus, Minus, ChevronDown, ChevronRight } from 'lucide-react';
import { DynamicFormField } from './DynamicFormField';
import { RepeatableGroup } from './RepeatableGroup';
import { MedicareMedicaidInfoModal } from './MedicareMedicaidInfoModal';
import { FieldDefinition } from '@/types/formTypes';
import { useFamilyAcl } from '@/contexts/FamilyAclContext';




interface Group {
  title?: string;
  instruction?: string;
  instructions?: string;
  fields: FieldDefinition[];
  repeatable?: boolean;
  itemLabel?: string;
  conditionalOn?: string;
}

interface Subsection {
  id: string;
  title: string;
  type?: string;
  description?: string;
  instructions?: string;
  fields: FieldDefinition[];
  groups?: Group[];
  repeatable?: boolean;
  itemLabel?: string;
  isRepeatable?: boolean;
  nonRepeatableFields?: FieldDefinition[];
  conditionalOn?: {
    sectionField: string;
    field: string;
    value: string;
  };
}

interface DynamicSectionProps {
  section: {
    id: string;
    title: string;
    subsections?: Subsection[];
    groups?: Group[];
    fields: FieldDefinition[];
    isRepeatable?: boolean;
    itemLabel?: string;
    nonRepeatableFields?: FieldDefinition[];
  };
  data: any;
  onChange: (data: any) => void;
  activeSubsection?: string | null;
  disabled?: boolean;
  disabledSubsections?: Record<string, boolean>;
  collapsedSubsections?: Record<string, boolean>;
  onToggleSubsectionDisabled?: (
    subsectionId: string,
    disabled: boolean,
  ) => void;
  onToggleSubsectionCollapsed?: (subsectionId: string) => void;
  fullFormData?: any; // Full form data from all sections for components that need cross-section access
}

export function DynamicSection({ section, data, onChange, activeSubsection,  disabledSubsections = {}, collapsedSubsections = {}, onToggleSubsectionDisabled, onToggleSubsectionCollapsed, fullFormData }: DynamicSectionProps) {
  const { isReadOnly } = useFamilyAcl();
  // Subsections that include obituary content (marked with dove symbol)
  const obituarySubsections = new Set(['20B']);
  // const updateField = (key: string, value: any) => {
  //   onChange({ ...data, [key]: value });
  // };

  const updateSubsectionData = (subsectionId: string, subsectionData: any) => {
    if (isReadOnly) return;
    onChange({ ...data, [subsectionId]: subsectionData });
  };

  const shouldRenderSubsection = (subsection: Subsection) => {
    if (!subsection.conditionalOn) return true;
    
    const { sectionField, field, value } = subsection.conditionalOn;
    const dependentSectionData = data[sectionField] || {};
    
    // Check if we have array data (repeatable) or object data
    if (Array.isArray(dependentSectionData)) {
      // For repeatable sections, check if any item has the condition met
      return dependentSectionData.some(item => item[field] === value);
    } else {
      // For regular sections, check the field directly
      return dependentSectionData[field] === value;
    }
  };

  const shouldRenderGroup = (group: Group, formData: any) => {
    if (!group.conditionalOn) return true;
    
    // Check if the conditional field is checked (for checkboxes) or matches a value
    const fieldValue = formData[group.conditionalOn];
    return fieldValue === true || fieldValue === 'true' || fieldValue === 'yes';
  };

  const renderSubsection = (subsection: Subsection) => {
    if (!shouldRenderSubsection(subsection)) {
      return null;
    }

    const subsectionData = data[subsection.id] || {};
    const isActive = activeSubsection === subsection.id;
    const isSubsectionDisabled = disabledSubsections[subsection.id] || false;

    // If subsection is disabled, show a grayed out placeholder
    if (isSubsectionDisabled) {
      return (
        <Card 
          key={`${section.id}-${subsection.id}-disabled`} 
          id={`subsection-${subsection.id}`}
          className="relative"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{subsection.id}</span>
              {subsection.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Cryptocurrency Subsection Opt-out Checkbox for disabled state */}
            {subsection.id === '10B' && onToggleSubsectionDisabled && (
              <div className="bg-muted border rounded-lg p-4 mb-4 relative z-10">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="crypto-accounts-opt-out-disabled"
                    checked={disabledSubsections['10B'] || false}
                    onChange={(e) => onToggleSubsectionDisabled('10B', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
                  />
                  <label htmlFor="crypto-accounts-opt-out-disabled" className="text-sm cursor-pointer">
                    <span className="font-medium">I do not have any cryptocurrency accounts.</span>
                    <p className="text-muted-foreground mt-1">
                      Check this box if you do not own any cryptocurrency, wallets, or exchange accounts. This will hide the cryptocurrency section.
                    </p>
                  </label>
                </div>
              </div>
            )}
            
            {/* Digital Payment Apps Subsection Opt-out Checkbox for disabled state */}
            {subsection.id === '10C' && onToggleSubsectionDisabled && (
              <div className="bg-muted border rounded-lg p-4 mb-4 relative z-10">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="digital-payment-apps-opt-out-disabled"
                    checked={disabledSubsections['10C'] || false}
                    onChange={(e) => onToggleSubsectionDisabled('10C', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
                  />
                  <label htmlFor="digital-payment-apps-opt-out-disabled" className="text-sm cursor-pointer">
                    <span className="font-medium">I do not use any digital payment apps.</span>
                    <p className="text-muted-foreground mt-1">
                      Check this box if you do not use any digital payment or money transfer apps like Venmo, PayPal, Cash App, Apple Pay, etc. This will hide the digital payment apps section.
                    </p>
                  </label>
                </div>
              </div>
            )}
            
            <div className="text-center py-8 opacity-50 pointer-events-none select-none">
              <p className="text-muted-foreground text-sm">
                This section has been marked as not applicable.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (subsection.type === 'info') {
      // Info section with just fields
      const isCollapsed = collapsedSubsections[subsection.id] || false;
      const isCollapsible = subsection.id === '16E'; // Make 16E collapsible
      
      return (
        <Card 
          key={`${section.id}-${subsection.id}`} 
          id={`subsection-${subsection.id}`}
          className={isActive ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
        >
          <CardHeader>
            <CardTitle 
              className={`flex items-center gap-2 ${isCollapsible ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
              onClick={isCollapsible && onToggleSubsectionCollapsed ? () => onToggleSubsectionCollapsed(subsection.id) : undefined}
            >
              {isCollapsible && (
                isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )
              )}
              <span className="text-sm text-muted-foreground">{subsection.id}</span>
              {obituarySubsections.has(subsection.id) && <span className="mr-1">🕊️</span>}
              {subsection.title}
            </CardTitle>
            {subsection.description && !isCollapsed && (
              <p className="text-sm text-muted-foreground mt-2">{subsection.description}</p>
            )}
          </CardHeader>
          {!isCollapsed && (
            <CardContent>
              <div className="space-y-4">
                {subsection.fields?.map((field) => (
                  <DynamicFormField
                    key={field.key}
                    field={field}
                    value={subsectionData[field.key]}
                    formData={field.type === 'NextOfKinLetter' || field.type === 'LettersToNextOfKin' ? fullFormData : subsectionData}
                    onChange={(value) => updateSubsectionData(subsection.id, {
                      ...subsectionData,
                      [field.key]: value
                    })}
                  />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      );
    }

    if (subsection.repeatable) {
      // Repeatable subsection (like vehicles or insurance policies)
      // Handle both old format (items array) and new format (direct array)
      const items = Array.isArray(subsectionData) ? subsectionData : (subsectionData.items || []);
      
      const addItem = () => {
        const newItems = [...items, {}];
        // Store as direct array for insurance policies and other repeatable subsections
        updateSubsectionData(subsection.id, newItems);
      };

      const removeItem = (index: number) => {
        const newItems = items.filter((_: any, i: number) => i !== index);
        updateSubsectionData(subsection.id, newItems);
      };

      const updateItem = (index: number, itemData: any) => {
        const newItems = [...items];
        newItems[index] = itemData;
        updateSubsectionData(subsection.id, newItems);
      };

      return (
        <Card 
          key={`${section.id}-${subsection.id}-repeatable`}
          id={`subsection-${subsection.id}`}
          className={isActive ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[16px]">
                  <span className="text-sm text-muted-foreground">{subsection.id}</span>
                  {obituarySubsections.has(subsection.id) && <span className="mr-1">🕊️</span>}
                  {subsection.title}
                </CardTitle>
                {subsection.description && (
                  <p className="text-sm text-muted-foreground mt-2">{subsection.description}</p>
                )}
                {/* Medicare & Medicaid Information Button for subsection 13E */}
                {subsection.id === '13E' && (
                  <div className="mt-3">
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                        📘 <strong>Medicare & Medicaid Resources Available</strong>
                      </p>
                      <MedicareMedicaidInfoModal />
                    </div>
                  </div>
                )}
              </div>
              {!isReadOnly && (
              <Button type="button" data-oa-mutate onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add {subsection.itemLabel}
              </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {subsection.instructions && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="text-sm text-blue-800 whitespace-pre-line">{subsection.instructions}</div>
              </div>
            )}
            
            {/* Cryptocurrency Subsection Opt-out Checkbox */}
            {subsection.id === '10B' && onToggleSubsectionDisabled && (
              <div className="bg-muted border rounded-lg p-4 mb-6 relative z-10">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="crypto-accounts-opt-out"
                    checked={disabledSubsections['10B'] || false}
                    onChange={(e) => onToggleSubsectionDisabled('10B', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
                  />
                  <label htmlFor="crypto-accounts-opt-out" className="text-sm cursor-pointer">
                    <span className="font-medium">I do not have any cryptocurrency accounts.</span>
                    <p className="text-muted-foreground mt-1">
                      Check this box if you do not own any cryptocurrency, wallets, or exchange accounts. This will hide the cryptocurrency section.
                    </p>
                  </label>
                </div>
              </div>
            )}
            
            {/* Digital Payment Apps Subsection Opt-out Checkbox */}
            {subsection.id === '10C' && onToggleSubsectionDisabled && (
              <div className="bg-muted border rounded-lg p-4 mb-6 relative z-10">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="digital-payment-apps-opt-out"
                    checked={disabledSubsections['10C'] || false}
                    onChange={(e) => onToggleSubsectionDisabled('10C', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
                  />
                  <label htmlFor="digital-payment-apps-opt-out" className="text-sm cursor-pointer">
                    <span className="font-medium">I do not use any digital payment apps.</span>
                    <p className="text-muted-foreground mt-1">
                      Check this box if you do not use any digital payment or money transfer apps like Venmo, PayPal, Cash App, Apple Pay, etc. This will hide the digital payment apps section.
                    </p>
                  </label>
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No {subsection.itemLabel?.toLowerCase()}s added yet. Click &quot;Add {subsection.itemLabel}&quot; to get started.</p>
              </div>
            )}

            {items.map((item: any, index: number) => (
              <Card 
                key={`${section.id}-${subsection.id}-item-${index}`} 
                id={`repeatable-item-${subsection.id}-${index}`}
                className="mb-4 p-4 scroll-mt-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4>{subsection.itemLabel} {index + 1}</h4>
                  {items.length > 0 && !isReadOnly && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      data-oa-mutate
                      onClick={() => removeItem(index)}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  {subsection.groups?.map((group, groupIndex) => {
                    if (!shouldRenderGroup(group, item)) return null;
                    
                    return (
                      <div
                        key={`${section.id}-${subsection.id}-${index}-group-${groupIndex}`}
                        className="space-y-4"
                      >
                        {group.title && <h5>{group.title}</h5>}
                        {(group.instruction || group.instructions) && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                            <p className="text-sm text-blue-800">
                              {group.instruction || group.instructions}
                            </p>
                          </div>
                        )}

                        {group.repeatable ? (
                          <RepeatableGroup
                            title=""
                            itemLabel={group.itemLabel || 'Item'}
                            fields={group.fields}
                            values={subsectionData[`group_${groupIndex}`] || []}
                            subsectionId={`${subsection.id}-group-${groupIndex}`}
                            onChange={values =>
                              updateSubsectionData(subsection.id, {
                                ...subsectionData,
                                [`group_${groupIndex}`]: values,
                              })
                            }
                          />
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {group.fields.map(field => (
                              <div
                                key={field.key}
                                className={
                                  field.type === 'TextArea' ||
                                  field.type === 'TextInputWithUpload' ||
                                  field.type === 'InstructionsModal' ||
                                  field.type === 'Checkbox' ||
                                  field.type === 'AccessManagement' ||
                                  field.type === 'LettersToNextOfKin'
                                    ? 'md:col-span-2'
                                    : ''
                                }
                              >
                                <DynamicFormField
                                  field={field}
                                  value={item[field.key]}
                                  formData={item}
                                  onChange={value =>
                                    updateItem(index, {
                                      ...item,
                                      [field.key]: value,
                                    })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {subsection.fields?.map((field) => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={item[field.key]}
                      formData={item}
                      onChange={(value) => updateItem(index, {
                        ...item,
                        [field.key]: value
                      })}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      );
    }

    if (subsection.isRepeatable && subsection.fields) {
      // Handle subsections with isRepeatable: true (like utility services 4C)
      // Extract items array and non-repeatable data
      const items = subsectionData?.items || [];
      const nonRepeatableData = { ...subsectionData };
      delete nonRepeatableData.items;
      
      const addItem = () => {
        const newItems = [...items, {}];
        updateSubsectionData(subsection.id, {
          ...nonRepeatableData,
          items: newItems
        });
      };

      const removeItem = (index: number) => {
        const newItems = items.filter((_: any, i: number) => i !== index);
        updateSubsectionData(subsection.id, {
          ...nonRepeatableData,
          items: newItems
        });
      };

      const updateItem = (index: number, itemData: any) => {
        const newItems = [...items];
        newItems[index] = itemData;
        updateSubsectionData(subsection.id, {
          ...nonRepeatableData,
          items: newItems
        });
      };

      const itemLabel = subsection.itemLabel || 'Service';

      return (
        <Card 
          key={`${section.id}-${subsection.id}-isRepeatable`}
          id={`subsection-${subsection.id}`}
          className={isActive ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[16px]">
                  <span className="text-sm text-muted-foreground">{subsection.id}</span>
                  {subsection.title}
                </CardTitle>
                {subsection.description && (
                  <p className="text-sm text-muted-foreground mt-2">{subsection.description}</p>
                )}
              </div>
              {!isReadOnly && (
              <Button type="button" data-oa-mutate onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add {itemLabel}
              </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No {itemLabel.toLowerCase()}s added yet. Click &quot;Add {itemLabel}&quot; to get started.</p>
              </div>
            )}

            {items.map((item: any, index: number) => (
              <Card 
                key={`${section.id}-${subsection.id}-item-${index}`} 
                id={`repeatable-item-${subsection.id}-${index}`}
                className="mb-4 p-4 scroll-mt-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4>{itemLabel} {index + 1}</h4>
                  {items.length > 0 && !isReadOnly && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      data-oa-mutate
                      onClick={() => removeItem(index)}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subsection.fields.map((field) => (
                    <div 
                      key={field.key}
                      className={field.type === 'TextArea' || field.type === 'TextInputWithUpload' || field.type === 'Instructions' || field.type === 'AccessManagement' ? 'md:col-span-2' : ''}
                    >
                      <DynamicFormField
                        field={field}
                        value={item[field.key]}
                        formData={item}
                        onChange={(value) => updateItem(index, {
                          ...item,
                          [field.key]: value
                        })}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {/* Render non-repeatable fields at the bottom */}
            {subsection.nonRepeatableFields && subsection.nonRepeatableFields.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subsection.nonRepeatableFields.map((field) => (
                      <div 
                        key={field.key}
                        className={field.type === 'TextArea' || field.type === 'TextInputWithUpload' || field.type === 'Instructions' || field.type === 'AccessManagement' ? 'md:col-span-2' : ''}
                      >
                        <DynamicFormField
                          field={field}
                          value={nonRepeatableData[field.key]}
                          formData={nonRepeatableData}
                          onChange={(value) => {
                            updateSubsectionData(subsection.id, {
                              ...nonRepeatableData,
                              [field.key]: value,
                              items: items
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      );
    }

    // Regular subsection with groups and/or fields
    const isCollapsed = collapsedSubsections[subsection.id] || false;
    const isCollapsible = subsection.id === '16E'; // Make 16E collapsible
    
    return (
      <Card 
        key={`${section.id}-${subsection.id}-regular`}
        id={`subsection-${subsection.id}`}
        className={isActive ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
      >
        <CardHeader>
          <CardTitle 
            className={`flex items-center gap-2 ${isCollapsible ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
            onClick={isCollapsible && onToggleSubsectionCollapsed ? () => onToggleSubsectionCollapsed(subsection.id) : undefined}
          >
            {isCollapsible && (
              isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            )}
            <span className="text-sm text-muted-foreground">{subsection.id}</span>
            {obituarySubsections.has(subsection.id) && <span className="mr-1">🕊️</span>}
            {subsection.title}
          </CardTitle>
          {subsection.description && !isCollapsed && (
            <p className="text-sm text-muted-foreground mt-2">{subsection.description}</p>
          )}
          {/* Medicare & Medicaid Information Button for subsection 13E */}
          {subsection.id === '13E' && !isCollapsed && (
            <div className="mt-3">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  📘 <strong>Medicare & Medicaid Resources Available</strong>
                </p>
                <MedicareMedicaidInfoModal />
              </div>
            </div>
          )}
        </CardHeader>
        {!isCollapsed && (
          <CardContent className="space-y-6">
          {subsection.instructions && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-400 p-4 mb-6">
              <div className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-line">{subsection.instructions}</div>
            </div>
          )}
          
          {/* Cryptocurrency Subsection Opt-out Checkbox */}
          {subsection.id === '10B' && onToggleSubsectionDisabled && (
            <div className="bg-muted border rounded-lg p-4 relative z-10">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="crypto-accounts-opt-out"
                  checked={disabledSubsections['10B'] || false}
                  onChange={(e) => onToggleSubsectionDisabled('10B', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
                />
                <label htmlFor="crypto-accounts-opt-out" className="text-sm cursor-pointer">
                  <span className="font-medium">I do not have any cryptocurrency accounts.</span>
                  <p className="text-muted-foreground mt-1">
                    Check this box if you do not own any cryptocurrency, wallets, or exchange accounts. This will hide the cryptocurrency section.
                  </p>
                </label>
              </div>
            </div>
          )}
          
          {/* Digital Payment Apps Subsection Opt-out Checkbox */}
          {subsection.id === '10C' && onToggleSubsectionDisabled && (
            <div className="bg-muted border rounded-lg p-4 relative z-10">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="digital-payment-apps-opt-out-regular"
                  checked={disabledSubsections['10C'] || false}
                  onChange={(e) => onToggleSubsectionDisabled('10C', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
                />
                <label htmlFor="digital-payment-apps-opt-out-regular" className="text-sm cursor-pointer">
                  <span className="font-medium">I do not use any digital payment apps.</span>
                  <p className="text-muted-foreground mt-1">
                    Check this box if you do not use any digital payment or money transfer apps like Venmo, PayPal, Cash App, Apple Pay, etc. This will hide the digital payment apps section.
                  </p>
                </label>
              </div>
            </div>
          )}
          
          {/* Freelance Income Subsection Opt-out Checkbox */}
          {subsection.id === '16F' && onToggleSubsectionDisabled && (
            <div className="bg-muted border rounded-lg p-4 relative z-10">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="freelance-income-opt-out-regular"
                  checked={disabledSubsections['16F'] || false}
                  onChange={(e) => onToggleSubsectionDisabled('16F', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
                />
                <label htmlFor="freelance-income-opt-out-regular" className="text-sm cursor-pointer">
                  <span className="font-medium">I do not have any freelance income.</span>
                  <p className="text-muted-foreground mt-1">
                    Check this box if you do not work as a freelancer, consultant, or independent contractor. This will hide the Freelance Income section.
                  </p>
                </label>
              </div>
            </div>
          )}
          
          {/* Other Income Subsection Opt-out Checkbox */}
          {subsection.id === '16G' && onToggleSubsectionDisabled && (
            <div className="bg-muted border rounded-lg p-4 relative z-10">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="other-income-opt-out-regular"
                  checked={disabledSubsections['16G'] || false}
                  onChange={(e) => onToggleSubsectionDisabled('16G', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
                />
                <label htmlFor="other-income-opt-out-regular" className="text-sm cursor-pointer">
                  <span className="font-medium">I do not have any other income sources.</span>
                  <p className="text-muted-foreground mt-1">
                    Check this box if you do not have any additional income sources beyond employment, business, Social Security, or retirement income. This will hide the Other Income section.
                  </p>
                </label>
              </div>
            </div>
          )}
          
          {subsection.groups?.map((group, groupIndex) => {
            if (!shouldRenderGroup(group, subsectionData)) return null;
            
            return (
              <div
                key={`${section.id}-${subsection.id}-group-${groupIndex}`}
                className="space-y-4"
              >
                {group.title && <h4>{group.title}</h4>}
                {(group.instruction || group.instructions) && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      {group.instruction || group.instructions}
                    </p>
                  </div>
                )}

                {group.repeatable ? (
                  <RepeatableGroup
                    title=""
                    itemLabel={group.itemLabel || 'Item'}
                    fields={group.fields}
                    values={subsectionData[`group_${groupIndex}`] || []}
                    subsectionId={`${subsection.id}-group-${groupIndex}`}
                    onChange={values =>
                      updateSubsectionData(subsection.id, {
                        ...subsectionData,
                        [`group_${groupIndex}`]: values,
                      })
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.fields.map(field => (
                      <div
                        key={field.key}
                        className={
                          field.type === 'TextArea' ||
                          field.type === 'TextInputWithUpload' ||
                          field.type === 'Checkbox' ||
                          field.type === 'Instructions' ||
                          field.type === 'AccessManagement'
                            ? 'md:col-span-2'
                            : ''
                        }
                      >
                        <DynamicFormField
                          field={field}
                          value={subsectionData[field.key]}
                          formData={
                            field.type === 'NextOfKinLetter' ||
                            field.type === 'LettersToNextOfKin'
                              ? fullFormData
                              : subsectionData
                          }
                          onChange={value =>
                            updateSubsectionData(subsection.id, {
                              ...subsectionData,
                              [field.key]: value,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {subsection.fields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subsection.fields.map((field) => (
                <div 
                  key={field.key}
                  className={field.type === 'TextArea' || field.type === 'TextInputWithUpload' || field.type === 'Instructions' || field.type === 'AccessManagement' ? 'md:col-span-2' : ''}
                >
                  <DynamicFormField
                    field={field}
                    value={subsectionData[field.key]}
                    formData={field.type === 'NextOfKinLetter' || field.type === 'LettersToNextOfKin' ? fullFormData : subsectionData}
                    onChange={(value) => updateSubsectionData(subsection.id, {
                      ...subsectionData,
                      [field.key]: value
                    })}
                  />
                </div>
              ))}
            </div>
          )}
          </CardContent>
        )}
      </Card>
    );
  };

  // Handle sections that have direct groups/fields instead of subsections
  if (!section.subsections || section.subsections.length === 0) {
    if (section.isRepeatable && section.fields) {
      // Handle repeatable sections (like utility services)
      // Extract items array and non-repeatable data
      const items = data?.items || [];
      const nonRepeatableData = { ...data };
      delete nonRepeatableData.items;
      
      const addItem = () => {
        const newItems = [...items, {}];
        onChange({
          ...nonRepeatableData,
          items: newItems
        });
      };

      const removeItem = (index: number) => {
        const newItems = items.filter((_: any, i: number) => i !== index);
        onChange({
          ...nonRepeatableData,
          items: newItems
        });
      };

      const updateItem = (index: number, itemData: any) => {
        const newItems = [...items];
        newItems[index] = itemData;
        onChange({
          ...nonRepeatableData,
          items: newItems
        });
      };

      const itemLabel = section.itemLabel || 'Service';

      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[16px]">
                    <span className="text-sm text-muted-foreground">{section.id}</span>
                    {section.title}
                  </CardTitle>
                </div>
                {!isReadOnly && (
                <Button type="button" data-oa-mutate onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add {itemLabel}
                </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No {itemLabel.toLowerCase()}s added yet. Click &quot;Add {itemLabel}&quot; to get started.</p>
                </div>
              )}

              {items.map((item: any, index: number) => (
                <Card 
                  key={`${section.id}-item-${index}`} 
                  id={`repeatable-item-${section.id}-${index}`}
                  className="mb-4 p-4 scroll-mt-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4>{itemLabel} {index + 1}</h4>
                    {items.length > 0 && !isReadOnly && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        data-oa-mutate
                        onClick={() => removeItem(index)}
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields.map((field) => (
                      <div 
                        key={field.key}
                        className={field.type === 'TextArea' || field.type === 'TextInputWithUpload' || field.type === 'Instructions' || field.type === 'AccessManagement' ? 'md:col-span-2' : ''}
                      >
                        <DynamicFormField
                          field={field}
                          value={item[field.key]}
                          formData={item}
                          onChange={(value) => updateItem(index, {
                            ...item,
                            [field.key]: value
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}

              {/* Render non-repeatable fields at the bottom */}
              {section.nonRepeatableFields && section.nonRepeatableFields.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.nonRepeatableFields.map((field) => (
                        <div 
                          key={field.key}
                          className={field.type === 'TextArea' || field.type === 'TextInputWithUpload' || field.type === 'Instructions' || field.type === 'AccessManagement' || field.type === 'LettersToNextOfKin' ? 'md:col-span-2' : ''}
                        >
                          <DynamicFormField
                            field={field}
                            value={nonRepeatableData[field.key]}
                            formData={nonRepeatableData}
                            onChange={(value) => {
                              onChange({
                                ...nonRepeatableData,
                                [field.key]: value,
                                items: items
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
    
    if (section.groups || section.fields) {
      // Create a virtual subsection for rendering non-repeatable sections
      const virtualSubsection: Subsection = {
        id: section.id,
        title: section.title,
        groups: section.groups,
        fields: section.fields
      };
      
      return (
        <div className="space-y-6">
          {renderSubsection(virtualSubsection)}
        </div>
      );
    }
    
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No content configured for this section</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {section.subsections.map((subsection) => (
        <div key={`subsection-wrapper-${subsection.id}`}>
          {renderSubsection(subsection)}
        </div>
      ))}
    </div>
  );
}