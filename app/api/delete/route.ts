import { NextRequest, NextResponse } from 'next/server';

const AI_API_URL = process.env.AI_API_URL || 'http://localhost:8000';

export async function DELETE(req: NextRequest): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { dosyaId } = body;

        console.log('Delete API proxy çağrıldı:', { dosyaId });

        if (!dosyaId?.trim()) {
            return NextResponse.json({
                success: false,
                error: 'Dosya ID boş olamaz.',
            }, { status: 400 });
        }

        const response = await fetch(`${AI_API_URL}/api/dokuman-sil`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dosyaId }),
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = { error: 'Python API hatası' };
            }
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({
            success: true,
            message: data.message || 'Döküman başarıyla silindi',
        });

    } catch (hata) {
        console.error('Delete API proxy hatası:', hata);

        return NextResponse.json({
            success: false,
            error: hata instanceof Error ? hata.message : 'Silme işlemi başarısız',
        }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
