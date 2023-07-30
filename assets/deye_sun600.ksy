meta:
  id: deye_sun600

seq:
  - id: header
    type: header
  - id: payload
    size: header.payload_length
    type:
      switch-on: header.msg_type
      cases:
        "msg_type::data": data_msg_payload
  - id: footer
    type: footer

types:
  header:
    seq:
      - id: magic
        contents: [0xa5]
      - id: payload_length
        type: u2le
      - id: unknown1
        type: u1
      - id: msg_type
        type: u1
        enum: msg_type
      - id: msg_id_response
        type: u1
      - id: msg_id_request
        type: u1
      - id: logger_sn
        type: u4le
  footer:
    seq:
      - id: checksum
        type: u1
      - id: magic
        contents: [0x15]
  
  data_msg_payload:
    seq:
      - id: payload_magic # Might be destination? 01 for logger, 02 for inverter
        size: 1 # has to be carried over to the response
      - size: 6
      - id: unknown_counter_1
        type: u2be
      - size: 8
      - id: unknown_counter_2
        type: u2le
      - size: 2
      - id: inverter_id
        size: 10
      - size: 6
      - id: kwh_total
        type: u4le
      - size: 4
      - id: grid_v
        type: u2le
      - size: 4
      - id: grid_i
        type: u2le
      - size: 4
      - id: grid_freq_hz
        type: u2le
      - id: grid_active_power_w
        type: u4le
      - id: inverter_radiator_temp_celsius
        type: s2le
      - size: 20
      - id: pv_1_v
        type: u2le
      - id: pv_1_i
        type: u2le
      - id: pv_2_v
        type: u2le
      - id: pv_2_i
        type: u2le
      - id: pv_3_v
        type: u2le
      - id: pv_3_i
        type: u2le
      - id: pv_4_v
        type: u2le
      - id: pv_4_i
        type: u2le
      - id: protocol_ver
        type: str
        size: 8
        encoding: ASCII
      - id: dc_master_fw_version
        type: str
        size: 8
        encoding: ASCII
      - id: ac_fw_version
        type: str
        size: 8
        encoding: ASCII
      - size: 4
      - id: inverter_rated_power_w
        type: u2be
      - size: 5
      - id: pv_1_kwh_today
        type: u2le
      - id: pv_2_kwh_today
        type: u2le
      - id: pv_3_kwh_today
        type: u2le
      - id: pv_4_kwh_today
        type: u2le
      - size: 1
      - id: pv_1_kwh_total
        type: u2be
      - size: 2
      - id: pv_2_kwh_total
        type: u2be
      - size: 2
      - id: pv_3_kwh_total
        type: u2be
      - size: 2
      - id: pv_4_kwh_total
        type: u2be
      - id: pv_ids
        size: 64
      - id: grid_freq_hz_overfreq_load_reduction_starting_point
        type: u2be
      - id: grid_overfreq_load_reduction_percent
        type: u2be
      - size: 8
      - id: grid_v_limit_upper
        type: u2be
      - id: grid_v_limit_lower
        type: u2be
      - id: grid_freq_hz_limit_upper
        type: u2be
      - id: grid_freq_hz_limit_lower
        type: u2be
      - size: 2
      - id: current_time
        size: 6


enums:
  msg_type:
    0x11: "handshake_response"
    0x12: "data_response"
    0x17: "heartbeat_response"
    0x41: "handshake"
    0x42: "data"
    0x47: "heartbeat"
