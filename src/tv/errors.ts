import { PairMessage_Status } from "./gen/proto/pair_pb"


export class TvError extends Error {
  constructor(public status: PairMessage_Status) {
    super()
  }
}
