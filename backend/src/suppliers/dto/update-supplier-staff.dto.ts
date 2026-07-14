import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierStaffDto } from './create-supplier-staff.dto';

export class UpdateSupplierStaffDto extends PartialType(CreateSupplierStaffDto) {}
