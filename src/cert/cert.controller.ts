import { Controller, Get, Param, Body, Post } from '@nestjs/common';
import { CertService } from './cert.service';
import { Cert } from './schema/cert.schema';

@Controller('cert')
export class CertController {
  constructor(private readonly certService: CertService) {}

  @Get()
  async getAll(): Promise<Cert[]> {
    return this.certService.findAll();
  }

  @Get(':jmcd')
  async getByJmcd(@Param('jmcd') jmcd: string): Promise<Cert | null> {
    return this.certService.findByJmcd(jmcd);
  }

  @Post()
  async upsert(@Body() certData: Partial<Cert>): Promise<Cert> {
    return this.certService.upsertCert(certData);
  }
}
