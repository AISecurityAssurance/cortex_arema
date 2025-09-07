import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TemplateDefinition } from '@/data/templates';

const CUSTOM_TEMPLATES_DIR = path.join(process.cwd(), 'src/data/templates/custom');

// Ensure the custom templates directory exists
async function ensureCustomDir() {
  try {
    await fs.access(CUSTOM_TEMPLATES_DIR);
  } catch {
    await fs.mkdir(CUSTOM_TEMPLATES_DIR, { recursive: true });
  }
}

// GET /api/templates - List all custom templates
export async function GET() {
  try {
    await ensureCustomDir();
    
    const files = await fs.readdir(CUSTOM_TEMPLATES_DIR);
    const templates: TemplateDefinition[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(CUSTOM_TEMPLATES_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        try {
          const template = JSON.parse(content) as TemplateDefinition;
          templates.push(template);
        } catch (error) {
          console.error(`Failed to parse template ${file}:`, error);
        }
      }
    }
    
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error loading custom templates:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST /api/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    await ensureCustomDir();
    
    const template: TemplateDefinition = await request.json();
    
    // Validate required fields
    if (!template.id || !template.name || !template.template) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Ensure it's marked as custom and editable
    template.metadata = {
      ...template.metadata,
      isCore: false,
      isEditable: true,
      createdAt: template.metadata?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Save to filesystem
    const filename = `${template.id}.json`;
    const filePath = path.join(CUSTOM_TEMPLATES_DIR, filename);
    
    // Check if file already exists
    try {
      await fs.access(filePath);
      return NextResponse.json(
        { error: 'Template with this ID already exists' },
        { status: 409 }
      );
    } catch {
      // File doesn't exist, we can create it
    }
    
    await fs.writeFile(filePath, JSON.stringify(template, null, 2));
    
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PUT /api/templates - Update an existing template
export async function PUT(request: NextRequest) {
  try {
    await ensureCustomDir();
    
    const template: TemplateDefinition = await request.json();
    
    if (!template.id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Update metadata
    template.metadata = {
      ...template.metadata,
      isCore: false,
      isEditable: true,
      updatedAt: new Date().toISOString(),
    };
    
    const filename = `${template.id}.json`;
    const filePath = path.join(CUSTOM_TEMPLATES_DIR, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    await fs.writeFile(filePath, JSON.stringify(template, null, 2));
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates?id=templateId - Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    const filename = `${templateId}.json`;
    const filePath = path.join(CUSTOM_TEMPLATES_DIR, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    await fs.unlink(filePath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}